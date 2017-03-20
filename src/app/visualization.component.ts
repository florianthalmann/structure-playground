import { Component, OnInit, OnChanges, SimpleChanges, Input, ViewChild, ElementRef } from '@angular/core';
import { DymoService } from './dymo.service';
import { MusicVisualization } from './mv/music-visualization';
import { ViewConfig } from './mv/types';
import { DymoCoordinates } from './mv/dymo-coordinates';
import { JsonGraph } from 'dymo-core';

@Component({
  selector: 'visualization',
  template: '<div class="d3-visuals" #visuals (window:resize)="onResize($event)"></div>',
  providers: []
})
export class VisualizationComponent implements OnInit, OnChanges {
  @ViewChild('visuals') private visualsContainer: ElementRef;
  @Input() private data: JsonGraph;
  @Input() private viewConfig: ViewConfig;
  @Input() private playingUris: Array<any>;
  private visualization: MusicVisualization;

  constructor(private dymoService: DymoService) { }

  ngOnInit() {
    this.init();
  }

  private init() {
    if (!this.visualization) {
      this.visualization = new DymoCoordinates(this.visualsContainer.nativeElement, this.onClick.bind(this));
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.init();
    if (changes['data']) {
      this.visualization.updateData(this.data);
    }
    if (changes['viewConfig']) {
      this.visualization.updateViewConfig(changes['viewConfig'].currentValue);
    }
    if (changes['playingUris']) {
      this.visualization.updatePlaying(changes['playingUris'].previousValue, changes['playingUris'].currentValue);
    }
  }

  onClick(dymo) {
    this.dymoService.startPlayingDymo(dymo);
  }

  onResize(event) {
    this.visualization.updateSize();
  }

}
