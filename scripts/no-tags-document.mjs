const lt = String.fromCharCode(60);
const gt = String.fromCharCode(62);
const slash = String.fromCharCode(47);

export function tag(name, attrs="", content="") {
    const open = attrs ? `${lt}${name} ${attrs}${gt}` : `${lt}${name}${gt}`;
    return `${open}${content}${lt}${slash}${name}${gt}`;
}

export function voidTag(name, attrs="") {
    return attrs ? `${lt}${name} ${attrs}${gt}` : `${lt}${name}${gt}`;
}

export function bootDocument(entryPath, stylesheetPath="") {
    const doctype = `${lt}!doctype html${gt}`;
    const metadata = [
        voidTag("meta", "charset=\"UTF-8\""),
        voidTag("meta", "name=\"viewport\" content=\"width=device-width, initial-scale=1.0\""),
    ].join("");
    const stylesheet = stylesheetPath
        ? voidTag("link", `rel=\"stylesheet\" href=\"${stylesheetPath}\"`)
        : "";
    const head = tag("head", "", metadata + tag("title", "", "Tagless Chart") + stylesheet);
    const root = tag("div", "id=\"root\"");
    const script = tag("script", `type=\"module\" src=\"${entryPath}\"`);
    const body = tag("body", "", root + script);

    return doctype + tag("html", "lang=\"en\"", head + body);
}
