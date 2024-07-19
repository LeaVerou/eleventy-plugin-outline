import Outline from "./Outline.js";
import re, * as match from "./re.js";

const idRegex = RegExp(match.id().source, "i");
const headingRegex = match.element({tag: "h(?<level>[2-6])"});

const figRegex = match.element({
	attr: {name: "id"},
	tag: "figure|table"
});
const defRegex = re`${figRegex}|${headingRegex}`;
const refRegex = match.element({tag: "a", attr: {name: "href", value: "#.+?"}, content: ""});

export default class Outlines {
	/**
	 * Get a figure or heading that corresponds to the given id across all scopes
	 * @param {string} id
	 * @returns {Heading | Figure}
	 */
	getById (id) {
		for (let scope in this) {
			let outline = this[scope];
			let ret = outline.getById(id);
			if (ret) {
				return ret;
			}
		}

		return null;
	}

	process (content, scope) {
		// Sections
		content = content.replaceAll(defRegex, (html, ...args) => {
			let groups = match.processGroups(args.at(-1));
			let {tag, attrs, content} = groups;
			let index = args.at(-3);

			this[scope] ??= new Outline(scope);

			if (tag.startsWith("h")) {
				let {level} = groups;

				// Trim and collapse whitespace
				let text = content.trim().replace(/\s+/g, " ");
				let id = attrs.match(idRegex)?.[2];

				// TODO set id if not present
				if (!id) {
					// Abort mission
					return html;
				}
				// For now, we assume that the id is always present
				let info = {id, level, text, attrs, index, html};

				// Find where this fits in the existing hierarchy
				info = this[scope].add(info);

				let attributesToAdd = `data-number="${ info.qualifiedNumber }" data-label="${ info.label }"`;

				return info.html = `<h${level} ${attributesToAdd}${attrs}>${text}</h${level}>`;
			}
			else {
				// Figure. Here the qualified number is only 2 levels deep: <scope> . <number>
				let {value: id} = groups;

				let info = {id, index, html};
				info = this[scope].addFigure(info);

				let attributesToAdd = `data-number="${ info.qualifiedNumber }" data-label="${ info.label }"`;

				html = html.replace("<" + tag, `$& ${ attributesToAdd }`)
				html = html.replace(/<(?:fig)?caption/gi, `$& ${ attributesToAdd }`);

				return info.html = html;
			}
		});

		return content;
	}

	resolveXRefs (content, scope) {
		let outline = scope === undefined ? this : this[scope];

		content = content.replaceAll(refRegex, (match, ...args) => {
			let groups = args.at(-1);
			let id = groups.value.slice(1);
			let info = outline.getById(id);

			if (!info) {
				// Not found
				return match;
			}

			return groups.open + info.label + " " + info.qualifiedNumber + groups.close;
		});

		return content;
	}
}