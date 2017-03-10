import { MusicVisualization } from './music-visualization';

export class DymoCoordinates extends MusicVisualization {

	constructor(element, private onClick) {
		super(element, {top: 0, bottom: 12, left: 35, right: 0}, true, true, false);
	}

	updateDataRepresentation() {
		var nodes = this.svg.selectAll(".node").data(this.data.nodes);

		nodes.enter()
			.append("circle")
			.attr("class", "node")
			.on("click", d => this.onClick(d))
			.style("fill", this.getHsl)
			.style("opacity", 0.3)
			.attr("r", 0)
			.attr("cx", this.getX)
			.attr("cy", this.getY)
			.transition()
				.duration(500) // time of duration
				.attr("r", this.getR); // width based on scale

		nodes
			.transition()
				.duration(500) // time of duration
				.style("fill", this.getHsl)
				.style("opacity", 0.3)
				.attr("r", this.getR) // width based on scale
				.attr("cx", this.getX)
				.attr("cy", this.getY);

		nodes.exit().remove();

		var nodeLabel = this.svg.selectAll(".nodelabel").data(this.data.nodes);

		nodeLabel.enter()
				.append("text")
				.attr("class", "nodelabel")
				.attr("fill", "#000")
				.attr("y", d => this.getY(d)+(this.getR(d)/3))
				.attr("x", d => this.getX(d)-(this.getR(d)))
				.style("font-size", d => this.getR(d))
				.text(this.getText);

		nodeLabel
			.transition()
				.duration(500) // time of duration
				.attr("y", d => this.getY(d)+(this.getR(d)/3))
				.attr("x", d => this.getX(d)-(this.getR(d)))
				.style("font-size", d => this.getR(d))
				.text(this.getText);

		nodeLabel.exit().remove();

		var edges = this.svg.selectAll(".edge").data(this.data.edges);

		edges.enter()
			.append("line")
			.attr("class", "edge")
			.style("stroke", d => this.getHsl(d.target))
			.style("opacity", 0.1)
			.style("stroke-width", 3)
			//get initial values from animated svg, beautiful hack!
			/*.attr("x1", d => nodes.filter((c, i) => c == d.source)[0][0].cx.baseVal.value)
			.attr("y1", d => nodes.filter((c, i) => c == d.source)[0][0].cy.baseVal.value)
			.attr("x2", d => nodes.filter((c, i) => c == d.target)[0][0].cx.baseVal.value)
			.attr("y2", d => nodes.filter((c, i) => c == d.target)[0][0].cy.baseVal.value)*/
			.transition()
				.duration(500)
				.attr("x1", d => this.getX(d.source))
				.attr("y1", d => this.getY(d.source))
				.attr("x2", d => this.getX(d.target))
				.attr("y2", d => this.getY(d.target));

		edges
			.transition()
				.duration(500) // time of duration
				.style("stroke", d => this.getHsl(d.target))
				.style("opacity", 0.1)
				.attr("x1", d => this.getX(d.source))
				.attr("y1", d => this.getY(d.source))
				.attr("x2", d => this.getX(d.target))
				.attr("y2", d => this.getY(d.target));

		edges.exit().remove();

	};

}
