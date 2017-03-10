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
  private filename = 'fugue.m4a';//'jackstraw77-05-07.mp3';//'25435__insinger__free-jazz-text.wav'
  private dymoGraph: JsonGraph;
  private viewConfig: ViewConfig;
  private playingDymos: string[];
  private visualsCount = _.range(2);

  constructor(private featureService: FeatureService, private dymoService: DymoService) { }

  ngOnInit(): void {
    this.dymoService.getDymoGraph().subscribe(updatedGraph => this.dymoGraph = updatedGraph);
    this.dymoService.getViewConfig().subscribe(updatedConfig => this.viewConfig = updatedConfig);
    this.dymoService.getPlayingDymos().subscribe(updatedDymos => this.playingDymos = updatedDymos);
    let audioPath = this.featureService.getAudiofilePath(this.filename);
    let featurePaths = this.featureService.getFeatureFilenames(this.filename);
    Promise.all([audioPath, featurePaths, this.dymoService.isReady()])
      .then(paths => this.dymoService.addDymo(paths[0], paths[1]));
  }

}
