import Heading from "./Heading.js";
import Figures from "./Figures.js";

export default class Outline extends Array {
	// Flat maps of id to object
	#index = new Map();
	#figureIndex = new Map();

	constructor (scope) {
		super();

		this.scope = scope;
	}

	get qualifiedNumber () {
		return this.scope?.qualifiedNumber ?? this.scope ?? "";
	}

	find (callback, options) {
		for (let heading of this) {
			let ret = heading.find(callback, options);

			if (ret !== undefined) {
				return ret;
			}
		}

		return null;
	}

	add (heading) {
		if (this.#index.has(heading.id)) {
			return this.#index.get(heading.id);
		}

		let last = this.at(-1); // possibly ancestor

		if (last && heading.level > last.level) {
			// This is a child
			heading = last.add(heading);
		}
		else {
			// This is a top-level section
			heading = Heading.from({
				...heading,
				number: this.length + 1,
				parent: this,
			});
			this.push(heading);
		}

		this.#index.set(heading.id, heading);

		return heading;
	}

	addFigure (figure) {
		if (this.#figureIndex.has(figure.id)) {
			return this.#figureIndex.get(figure.id);
		}

		let last = this.at(-1);

		if (last) {
			return last.addFigure(figure);
		}
		else {
			this.figures ??= new Figures(this);
			return this.figures.add(figure);
		}
	}

	toJSON () {
		return this.slice();
	}
}

