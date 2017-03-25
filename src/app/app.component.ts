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
  //private filename = 'fugue.m4a';//'jackstraw77-05-07.mp3';'gallivanture.m4a'
  private filename1 = 'jackstraw77-05-07.mp3';
  private filename2 = 'jackstraw77-05-08.mp3';
  private dymoGraph: JsonGraph;
  private viewConfig: ViewConfig;
  private playingDymos: string[];
  private visualsCount = _.range(1);
  private options = {
    iterative: true,
    similarityThreshold: 0.99,
    minSegmentLength: 5,
    maxThreshold: 10,
    endThreshold: 0,
    onlyDiagonals: true,
    patternIndices: ""
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

  update(): void {
    let options = _.clone(this.options);
    options.patternIndices = JSON.stringify(options.patternIndices);
    this.dymoService.induceStructureSW(this.options);
  }

}
