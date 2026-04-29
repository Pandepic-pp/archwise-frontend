interface RawElement {
  id: string;
  type: string;
  text?: string;
  label?: { text?: string };
  containerId?: string | null;
  startBinding?: { elementId: string } | null;
  endBinding?: { elementId: string } | null;
  isDeleted?: boolean;
}

export interface StructuredComponent {
  id: string;
  type: string;
  label: string;
  shape: string;
}

export interface StructuredConnection {
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  arrowLabel?: string;
}

export interface StructuredDiagram {
  components: StructuredComponent[];
  connections: StructuredConnection[];
  freeTextAnnotations: string[];
  isEmpty: boolean;
}

const SHAPE_TYPES = new Set(['rectangle', 'ellipse', 'diamond', 'triangle']);

function inferComponentType(label: string): string {
  const l = label.toLowerCase();
  if (/\b(cache|redis|memcach|elasticache)\b/.test(l)) return 'cache';
  if (/\b(db|database|postgres|mysql|mongo|dynamo|cassandra|sqlite|rds|cockroach)\b/.test(l)) return 'database';
  if (/\b(queue|kafka|rabbit|sqs|pub.?sub|event.?bus|stream|broker|nats)\b/.test(l)) return 'queue';
  if (/\b(client|user|browser|mobile|frontend|app|end.?user)\b/.test(l)) return 'client';
  if (/\b(cdn|cloudfront|akamai|edge|varnish)\b/.test(l)) return 'cdn';
  if (/\b(storage|s3|blob|gcs|object.?store|file.?store)\b/.test(l)) return 'storage';
  if (/\b(lb|load.?balancer|nginx|haproxy|reverse.?proxy|elb|alb)\b/.test(l)) return 'loadBalancer';
  if (/\b(api.?gateway|gateway|kong|envoy)\b/.test(l)) return 'gateway';
  if (/\b(auth|oauth|jwt|identity|sso|iam)\b/.test(l)) return 'auth';
  if (/\b(search|elastic|solr|lucene|opensearch)\b/.test(l)) return 'search';
  if (/\b(service|server|api|worker|processor|handler|microservice)\b/.test(l)) return 'service';
  return 'component';
}

export function parseExcalidrawScene(sceneJson: string): StructuredDiagram {
  let elements: RawElement[] = [];

  try {
    const parsed = JSON.parse(sceneJson);
    elements = (Array.isArray(parsed.elements) ? parsed.elements : []).filter(
      (e: RawElement) => !e.isDeleted
    );
  } catch {
    return { components: [], connections: [], freeTextAnnotations: [], isEmpty: true };
  }

  if (elements.length === 0) {
    return { components: [], connections: [], freeTextAnnotations: [], isEmpty: true };
  }

  const labelMap = new Map<string, string>(); // elementId → display text
  const shapes: RawElement[] = [];
  const arrowEls: RawElement[] = [];
  const freeTexts: string[] = [];

  for (const el of elements) {
    switch (el.type) {
      case 'text': {
        const txt = el.text?.trim() ?? '';
        if (!txt) break;
        if (el.containerId) {
          // Bound text label for a shape
          const existing = labelMap.get(el.containerId);
          if (!existing) labelMap.set(el.containerId, txt);
        } else {
          freeTexts.push(txt);
        }
        break;
      }
      case 'arrow':
      case 'line':
        arrowEls.push(el);
        // Inline label on arrow (Excalidraw 0.17+ style)
        if (el.label?.text?.trim()) {
          labelMap.set(el.id, el.label.text.trim());
        }
        break;
      default:
        if (SHAPE_TYPES.has(el.type)) {
          shapes.push(el);
          // Inline label (older format)
          if (el.label?.text?.trim()) {
            labelMap.set(el.id, el.label.text.trim());
          }
        }
    }
  }

  const components: StructuredComponent[] = shapes.map((s) => {
    const label = labelMap.get(s.id) ?? '';
    return {
      id: s.id,
      type: inferComponentType(label),
      label: label || s.type,
      shape: s.type,
    };
  });

  const compById = new Map(components.map((c) => [c.id, c]));

  const connections: StructuredConnection[] = arrowEls
    .filter((a) => a.startBinding?.elementId && a.endBinding?.elementId)
    .flatMap((a) => {
      const from = compById.get(a.startBinding!.elementId);
      const to = compById.get(a.endBinding!.elementId);
      if (!from || !to) return [];
      return [
        {
          fromId: from.id,
          toId: to.id,
          fromLabel: from.label,
          toLabel: to.label,
          arrowLabel: labelMap.get(a.id),
        },
      ];
    });

  return {
    components,
    connections,
    freeTextAnnotations: freeTexts,
    isEmpty: components.length === 0 && connections.length === 0,
  };
}

export function diagramToTextDescription(diagram: StructuredDiagram): string {
  if (diagram.isEmpty) return 'The whiteboard is empty — no components drawn yet.';

  const lines: string[] = [];

  if (diagram.components.length > 0) {
    lines.push('Components:');
    diagram.components.forEach((c) => {
      const typeSuffix = c.type !== 'component' ? ` [${c.type}]` : '';
      lines.push(`  - ${c.label}${typeSuffix}`);
    });
  }

  if (diagram.connections.length > 0) {
    lines.push('\nConnections / Data Flow:');
    diagram.connections.forEach((conn) => {
      const lbl = conn.arrowLabel ? ` (${conn.arrowLabel})` : '';
      lines.push(`  - ${conn.fromLabel} → ${conn.toLabel}${lbl}`);
    });
  }

  if (diagram.freeTextAnnotations.length > 0) {
    lines.push('\nAnnotations / Notes:');
    diagram.freeTextAnnotations.forEach((t) => lines.push(`  - ${t}`));
  }

  return lines.join('\n');
}
