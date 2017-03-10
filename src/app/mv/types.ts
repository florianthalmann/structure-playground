export interface Margins {
	top: number,
	bottom: number,
	left: number,
	right: number
}

export interface ViewConfig {
  xAxis: ViewConfigDim,
  yAxis: ViewConfigDim,
  size: ViewConfigDim,
  color: ViewConfigDim
}

export interface ViewConfigDim {
  name: string,
  param: Object,
  log: boolean
}