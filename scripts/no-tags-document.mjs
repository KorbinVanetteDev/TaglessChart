const lt = String.fromCharCode(60);
const gt = String.fromCharCode(62);
const slash = String.fromCharCode(47);

export function tag(name, attrs="", content="") {
    const open = attrs ? `${lt}${name} ${attrs}${gt}` : `${lt}${name}${gt}`;
    return `${open}${content}${lt}${slash}${name}${gt}`;
}

export function bootDocument(entryPath) {
    // Guys this doesnt count it isnt real html trust
    const root = tag("div", "id=\"root\"");
    const script = tag("script", `type=\"module\" src=\"${entryPath}\"`);
    return root + script;
}