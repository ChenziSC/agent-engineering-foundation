function exact(value, keys, label) { if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== [...keys].sort().join()) throw new Error(`${label} 字段与契约不一致`); }
const NAME = /^[a-z][a-z0-9_]{1,63}$/u;
export function validateEventCatalog(catalog) {
  exact(catalog, ['version', 'events'], 'Event Catalog');
  if (catalog.version !== 1 || !Array.isArray(catalog.events)) throw new Error('Event Catalog 版本或 events 无效');
  const names = new Set();
  for (const event of catalog.events) {
    exact(event, ['name', 'purpose', 'trigger', 'status', 'properties', 'replacement', 'validation_scenarios'], `Event ${event.name}`);
    if (!NAME.test(event.name) || names.has(event.name) || !event.purpose?.trim() || !event.trigger?.trim() || !['draft', 'active', 'deprecated', 'retired'].includes(event.status)) throw new Error('Event 基础字段无效或重复');
    names.add(event.name);
    if (!Array.isArray(event.validation_scenarios) || !event.validation_scenarios.length || new Set(event.validation_scenarios).size !== event.validation_scenarios.length) throw new Error(`Event ${event.name} validation_scenarios 无效`);
    if (!Array.isArray(event.properties)) throw new Error(`Event ${event.name} properties 无效`);
    const properties = new Set();
    for (const property of event.properties) {
      exact(property, ['name', 'type', 'required', 'source', 'privacy', 'approval_ref'], `Property ${property.name}`);
      if (!/^[a-z][a-z0-9_]{0,63}$/u.test(property.name) || properties.has(property.name) || !['string', 'number', 'boolean'].includes(property.type) || typeof property.required !== 'boolean' || !property.source?.trim() || !['none', 'coarse', 'sensitive'].includes(property.privacy)) throw new Error(`Event ${event.name} Property 无效或重复`);
      if (property.privacy === 'sensitive' && !property.approval_ref?.trim()) throw new Error(`敏感属性 ${event.name}.${property.name} 缺少审批引用`);
      properties.add(property.name);
    }
  }
  for (const event of catalog.events) if (event.status === 'deprecated' && (!event.replacement || !names.has(event.replacement) || event.replacement === event.name)) throw new Error(`废弃 Event ${event.name} 缺少有效替代项`);
  return { ok: true, events: catalog.events.length, sensitive_properties: catalog.events.flatMap((event) => event.properties).filter((property) => property.privacy === 'sensitive').length };
}
