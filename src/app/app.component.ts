import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { FeatureService } from './feature.service';
import { DymoService } from './dymo.service';
import { ViewConfig } from './mv/types';
import { JsonGraph } from 'dymo-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  providers: [ FeatureService, DymoService ]
})
export class AppComponent implements OnInit {

  title = 'Musical Structure Playground';
  //private filename = 'fugue.m4a';//'jackstraw77-05-07.mp3';//'25435__insinger__free-jazz-text.wav'
  private filename1 = 'jackstraw77-05-07.mp3';
  private filename2 = 'jackstraw77-05-08.mp3';
  private dymoGraph: JsonGraph;
  private viewConfig: ViewConfig;
  private playingDymos: string[];
  private visualsCount = _.range(1);
  private options = {
    iterative: true,
    minSegmentLength: 10,
    maxThreshold: 20,
    endThreshold: 0,
    patternIndices: "[0,1,2,3]"
  };

  constructor(private featureService: FeatureService, private dymoService: DymoService) { }

  ngOnInit(): void {
    this.dymoService.getDymoGraph().subscribe(updatedGraph => this.dymoGraph = updatedGraph);
    this.dymoService.getViewConfig().subscribe(updatedConfig => this.viewConfig = updatedConfig);
    this.dymoService.getPlayingDymos().subscribe(updatedDymos => this.playingDymos = updatedDymos);
    this.addDymo(this.filename1)
      .then(u => this.update());
    /*this.addDymo(this.filename1)
      .then(u => uri1 = u)
      .then(r => this.addDymo(this.filename2))
      .then(u => uri2 = u)
      .then(r => {
        let options = _.clone(this.options);
        options.patternIndices = JSON.stringify(options.patternIndices);
        this.dymoService.testSmithWatermanComparison(uri1, uri2, this.options);
      });*/
  }

  addDymo(filename: string): Promise<string> {
    let audioPath = this.featureService.getAudiofilePath(filename);
    let featurePaths = this.featureService.getFeatureFilenames(filename);
    return Promise.all([audioPath, featurePaths, this.dymoService.isReady()])
      .then(paths => this.dymoService.addDymo(paths[0], paths[1]))
  }

  play(): void {
    this.dymoService.startPlaying();
  }

  stop(): void {
    this.dymoService.stopPlaying();
  }

  reload(): void {
    this.dymoService.reload();
  }

  updateIterative(value: boolean): void {
    this.options.iterative = value;
    this.update();
  }

  updateMinSegmentLength(value: string): void {
    this.options.minSegmentLength = JSON.parse(value);
    this.update();
  }

  updateMaxThreshold(value: string): void {
    this.options.maxThreshold = JSON.parse(value);
    this.update();
  }

  updateEndThreshold(value: string): void {
    this.options.endThreshold = JSON.parse(value);
    this.update();
  }

  updatePatterns(value: string): void {
    this.options.patternIndices = value;
    this.update();
  }

  update(): void {
    let options = _.clone(this.options);
    options.patternIndices = JSON.stringify(options.patternIndices);
    this.dymoService.induceStructureSW(this.options);
  }

}
