import * as d3 from 'd3';
import { JsonGraph, JsonEdge } from 'dymo-core';
import { Margins, ViewConfig, ViewConfigDim } from './types';

export abstract class MusicVisualization {

	protected svg;
	protected data: JsonGraph;
	private margins: Margins;
	private xAxis;
	private yAxis;
	private xScale;
	private yScale;
	private widthScale;
	private heightScale;
	private sizeScale;
	private colorScale;
	private width;
	private height;
	private viewconfig: ViewConfig;
	private prevRandomValues = {};
	private playingUris = [];

	constructor(private element, margins, private showAxes, private highlightInEdges, private noY) {
		this.margins = margins ? margins : { top: 0, bottom: 0, left: 0, right: 0};
		this.updateWidthAndHeight();
		this.svg = d3.select(this.element).append('svg')
			.attr('width', this.element.offsetWidth)
			.attr('height', this.element.offsetHeight);
	}

	updateWidthAndHeight() {
		if (this.element) {
			this.width = this.element.offsetWidth - this.margins.left - this.margins.right;
			this.height = this.element.offsetHeight - this.margins.top - this.margins.bottom;
		}
	}

	getSvg() {
		return this.svg;
	}

	getDimension() {
		return [this.width, this.height]
	}

	updateData(data) {
		this.data = data;
		this.updateDataRepresentation();
	}

	protected abstract updateDataRepresentation();

	updatePlaying(oldVals, newVals) {
		if (oldVals.filter && newVals) {
			this.playingUris = newVals;
			var toSelect = newVals.filter(i => oldVals.indexOf(i) < 0);
			var toDeselect = oldVals.filter(i => newVals.indexOf(i) < 0);

			var lines = this.svg.selectAll(".edge");
			lines.filter(e => toSelect.indexOf(this.getHighlightedEdge(e)) >= 0)
				.style("stroke", "black")
				.style("opacity", 0.4);
			lines.filter(e => toDeselect.indexOf(this.getHighlightedEdge(e)) >= 0)
				.style("stroke", e => this.getHsl(e.target))
				.style("opacity", 0.1);

			var circles = this.svg.selectAll(".node");
			circles.filter(d => toSelect.indexOf(d["@id"]) >= 0)
				.style("fill", "black")
				.style("opacity", 0.6);
			circles.filter(d => toDeselect.indexOf(d["@id"]) >= 0)
				.style("fill", this.getHsl)
				.style("opacity", 0.3);
		}
	}

	private getHighlightedEdge(d: JsonEdge) {
		if (this.highlightInEdges) {
			return d.target["@id"];
		}
		return d.source["@id"];
	}

	updateSize() {
		this.updateWidthAndHeight();
		this.svg.attr('width', this.element.offsetWidth);
		if (this.xScale) {
			this.updateScaleRanges();
			this.updateAxes();
		}
		this.updateDataRepresentation();
	}

	updateViewConfig(viewConfig: ViewConfig) {
		this.viewconfig = viewConfig;
		if (!this.xScale) {
			this.createScales();
			this.updateScaleRanges();
		}
		this.updateScaleDomains();
		this.updateAxes();
	}

	private createScales() {
		this.xScale = this.createScale(this.viewconfig.xAxis.log);
		this.yScale = this.createScale(this.viewconfig.yAxis.log && !this.noY);
		this.sizeScale = this.createScale(this.viewconfig.size.log);
		this.widthScale = this.createScale(this.viewconfig.xAxis.log);
		this.heightScale = this.createScale(this.viewconfig.yAxis.log);
		this.colorScale = this.createScale(this.viewconfig.color.log);
	}

	private createScale(log) {
		return log ? d3.scaleLog().base(2) : d3.scaleLinear();
	}

	private updateScaleDomains() {
		this.updateScaleDomain(this.xScale, this.viewconfig.xAxis);
		if (!this.noY) {
			this.updateScaleDomain(this.yScale, this.viewconfig.yAxis);
		}
		this.updateScaleDomain(this.sizeScale, this.viewconfig.size);
		this.updateScaleDomain(this.widthScale, this.viewconfig.xAxis);
		this.updateScaleDomain(this.heightScale, this.viewconfig.yAxis);
		this.updateScaleDomain(this.colorScale, this.viewconfig.color);
	}

	private updateScaleRanges() {
		this.xScale.range([this.margins.left, this.width-this.margins.right]);
		this.yScale.range([this.height-this.margins.bottom, this.margins.bottom]);
		this.sizeScale.range([10, 40]);
		this.widthScale.range([0, this.width - this.margins.left - this.margins.right]);
		this.heightScale.range([0, this.height - this.margins.top - this.margins.bottom]);
		this.colorScale.rangeRound([45, 360]);
	}

	private updateScaleDomain(scale, config) {
		if (config.param) {
			if (config.log) {
				var min = config.param.min;
				if (min <= 0) {
					min = 0.0000001;
				}
				scale.domain([min, config.param.max]);
			} else if (config.param.min != config.param.max) {
				scale.domain([config.param.min, config.param.max]);
			} else {
				//in case all values are the same...
				scale.domain([config.param.min/2, config.param.max*2]);
			}
		}
	}

	private updateAxes() {
		if (this.showAxes) {
			if (!this.xAxis) {
				// Axes. Note the inverted domain for the y-scale: bigger is up!
				this.xAxis = d3.axisBottom(this.xScale),
				this.yAxis = d3.axisLeft(this.yScale);
				this.svg.append("g")
					.attr("class", "xaxis");
				this.svg.append("g")
					.attr("class", "yaxis");
			} else {
				// Axes. Note the inverted domain for the y-scale: bigger is up!
				this.xAxis.scale(this.xScale),
				this.yAxis.scale(this.yScale);
			}
			this.svg.selectAll("g.xaxis")
				.attr("transform", "translate(0," + (this.height - this.margins.bottom) + ")")
				.call(this.xAxis);

			this.svg.selectAll("g.yaxis")
				.attr("transform", "translate(" + this.margins.left + ",0)")
				.call(this.yAxis);
		}
	}

	getX = (d, i?) => {
		return this.xScale(this.getVisualValue(d, {name:"time"}));//return xScale(getVisualValue(d, scope.viewconfig.xAxis.param, "x"));
	}

	getY0 = () => {
		return this.yScale(0);
	}

	getY = (d, i?) => {
		return this.yScale(this.getVisualValue(d, this.viewconfig.yAxis.param, "y"));
	}

	getR = (d) => {
		return this.sizeScale(this.getVisualValue(d, this.viewconfig.size.param, "size"));
	}

	getWidth = (d) => {
		return this.widthScale(this.getVisualValue(d, {name:"duration"}, "width"));
	}

	getHeight = (d) => {
		//if (d["@id"] != "dymo0") {
			return this.heightScale(this.getVisualValue(d, this.viewconfig.yAxis.param, "height"));
		//}
		//return 0;
	}

	getHsl = (d) => {
		if (this.playingUris.indexOf(d["@id"]) >= 0) {
			return "black";
		}
		return "hsl(" + this.colorScale(this.getVisualValue(d, this.viewconfig.color.param, "color")) + ", 80%, 50%)";
	}

	getRgb = (d) => {
		var color = "rgb(" + this.colorScale(this.getVisualValue(d, this.viewconfig.color.param, "color")) + ","
			+ (255-this.colorScale(this.getVisualValue(d, this.viewconfig.color))) + ","
			+ this.colorScale(this.getVisualValue(d, this.viewconfig.color)) +")";
		return color;
	}

	getText = (d) => {
		var text = this.getVisualValue(d, {name:"simplechord"}, "text");
		if (text != 0) {
			return text;
		}
		return "";
	}

	private getVisualValue(dymo, parameter?, key?) {
		if (parameter.name == "random") {
			if (!this.prevRandomValues[dymo["@id"]]) {
				this.prevRandomValues[dymo["@id"]] = {};
			}
			if (!this.prevRandomValues[dymo["@id"]][key]) {
				this.prevRandomValues[dymo["@id"]][key] = Math.random() * parameter.max;
			}
			return this.prevRandomValues[dymo["@id"]][key];
		} else {
			if (this.prevRandomValues[dymo["@id"]] && this.prevRandomValues[dymo["@id"]][key]) {
				delete this.prevRandomValues[dymo["@id"]][key];
			}
			if (dymo["features"]) {
				var value;
				if (Array.isArray(dymo["features"])) {
					var feature = dymo["features"].filter(f => f["@type"] == parameter.name);
					if (feature.length > 0) {
						if (typeof feature[0]["value"] == "string") {
							value = feature[0]["value"];
						} else {
							value = feature[0]["value"]["@value"];
						}
					}
				} else if (dymo["features"]["@type"] == parameter.name) {
					value = dymo["features"]["value"]["@value"];
				}
				//console.log(parameter.name, value)
				if (!isNaN(value)) {
					//not suitable for vectors!! (just takes the first element..)
					if (Array.isArray(value)) {
						value = value[0];
					}
					value = Number(value);
					return value;
				}
				if (typeof value == "string") {
					return value;
				}
			}
			return 0;//0.00000001; //for log scale :(
		}
	}
}