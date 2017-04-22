import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import * as math from 'mathjs';
import * as _ from 'lodash';
import { JsonGraph, DymoManager, uris } from 'dymo-core';
import { DymoGenerator, DymoTemplates } from 'dymo-generator';
import { QUANT_FUNCS, OPTIMIZATION, IterativeSmithWatermanResult } from 'siafun';
import { ViewConfig, ViewConfigDim } from './mv/types';
import { availableFeatures } from './features';
import { FeatureService } from './feature.service';

@Injectable()
export class DymoService {

  private generator = new DymoGenerator();

  private viewConfigTemplate: ViewConfig = {
    xAxis: this.createConfig("x-axis"),
    yAxis: this.createConfig("y-axis"),
    size: this.createConfig("size"),
    color: this.createConfig("color")
  };
  private createConfig(name): ViewConfigDim {
    return { name:name, param:{name:"random", uri:null, min:0, max:1}, log:false};
  }

  constructor(private featureService: FeatureService) { }

  isReady(): Promise<any> {
    return this.generator.isReady();
  }

  getViewConfig(): Observable<ViewConfig> {
    return this.generator.getManager().getFeatureInfo().map(fs => this.adjustViewConfig(fs));
  }

  getDymoGraph(): Observable<JsonGraph> {
    return this.generator.getManager().getJsonGraph(uris.DYMO, uris.HAS_PART, true);
  }

  reload() {
    this.generator.getManager().reloadFromStore();
  }

  getPlayingDymos(): Observable<string[]> {
    return this.generator.getManager().getPlayingDymoUris()//.debounceTime(50);
  }

  startPlaying(): void {
    this.generator.getManager().startPlaying();
  }

  startPlayingDymo(dymo: Object): void {
    this.generator.getManager().startPlayingUri(dymo["@id"]);
  }

  stopPlaying(): void {
    this.generator.getManager().stopPlaying();
  }

  addDymo(sourceFile, featureFiles): Promise<string> {
    var [orderedFiles, subsetConditions] = this.filterSelectedFeatures(featureFiles);
    return DymoTemplates.createSingleSourceDymoFromFeatures(this.generator, sourceFile, orderedFiles, subsetConditions);
  }

  induceStructure(patternIndices: number[]) {
    var QF = QUANT_FUNCS;
    function getPointsInBoundingBox(pattern, allPoints) {
      var maxes = math.max(pattern, 0);
      var mins = math.min(pattern, 0);
      return allPoints.filter(p => p.every((e,i) => maxes[i] - mins[i] == 0 || (mins[i] <= e && e <= maxes[i])));
    }
    var options = {
      quantizerFunctions: [QF.SORTED_SUMMARIZE(3), QF.CONSTANT(0), QF.ORDER()],
      //heuristic: dymoCore.HEURISTICS.COVERAGE,
      selectionHeuristic: (pattern, vectors, occurrences, allPoints) => {
        var dim = 3;//pattern[0].length;
        //var gaps = getPointsInBoundingBox(pattern, allPoints).length - pattern.length;
        //var result = pattern.length / Math.pow(1+gaps, 1/dim);

        //var result = pattern.length * Math.sqrt(math.mean(vectors.map(v => math.norm(v)))) // * Math.sqrt(occurrences.length);

        var norms = vectors.map(v => Math.sqrt(math.sum(v.map(p => Math.pow(p,2)))));//vectors.map(v => math.norm(v));
        var avgNorm = Math.sqrt(math.mean(norms))
        /*var result = 0;
        if (math.mean(norms) > 5) {//pattern.length > 10) {
          result = pattern.length * Math.sqrt(Math.log(occurrences.length) * Math.sqrt(math.mean(norms)));
        }*/

        var patternDuration = math.norm(math.subtract(pattern[pattern.length-1], pattern[0]));
        //var result = pattern.length // / Math.pow(1+gaps, 1/dim) * Math.sqrt(math.mean(norms))
        //TODO BEST var result = pattern.length > 1 ? pattern.length * Math.pow(avgNorm / patternDuration, 1/3) : 0;
        var result = pattern.length > 3 ? pattern.length * avgNorm / Math.sqrt(patternDuration) : 0;

        return result;
      },
      overlapping: true,
      optimizationMethod: OPTIMIZATION.NONE,
      optimizationHeuristic: (pattern, vectors, occurrences, allPoints) => {
        var dim = 4;
        var gaps = getPointsInBoundingBox(pattern, allPoints).length - pattern.length;
        return pattern.length // Math.pow(1+gaps, 1/dim);
      },
      optimizationDimension: 5,
      patternIndices: patternIndices
    }
    DymoTemplates.createStructuredDymoFromFeatures(this.generator, options);
  }

  induceStructureSW(options: Object): Promise<IterativeSmithWatermanResult> {
    var QF = QUANT_FUNCS;
    options["quantizerFunctions"] = [QF.IDENTITY(), QF.CONSTANT(0), QF.ORDER()];
    //options.optimizationDimension: 5,
    return DymoTemplates.createStructuredDymoFromFeatures(this.generator, options)
      .then(r => r.matrices.forEach((m,i) =>
        this.featureService.postFile('matrix'+i+'.json', m.scoreMatrix)
      ));
  }

  testSmithWatermanComparison(uri1, uri2, options: Object) {
    var QF = QUANT_FUNCS;
    options["quantizerFunctions"] = [QF.SORTED_SUMMARIZE(10), QF.CONSTANT(0), QF.ORDER()],
    //options.optimizationDimension: 5,
    DymoTemplates.testSmithWatermanComparison(this.generator, options, uri1, uri2);
  }

  private filterSelectedFeatures(featureUris) {
    var orderedFiles = [];
    var subsetConditions = [];
    for (var i = 0; i < availableFeatures.length; i++) {
      if (availableFeatures[i].selected) {
        var currentFeatureFile = featureUris.filter(f => f.indexOf(availableFeatures[i].name) >= 0)[0];
        if (currentFeatureFile) {
          orderedFiles.push(currentFeatureFile);
          subsetConditions.push(availableFeatures[i].subset);
        }
      }
    }
    //orderedFiles = orderedFiles.map(function(f){return f});
    return [orderedFiles, subsetConditions];
  }

  private adjustViewConfig(features): ViewConfig {
    let newConfig = _.clone(this.viewConfigTemplate);
    this.setParam(newConfig.xAxis, "time", features);
    this.setParam(newConfig.yAxis, "level", features);
    this.setParam(newConfig.size, "duration", features);
    return newConfig;
  }

  private setParam(viewParam, featureName, features) {
    features = features.filter(f => f.name === featureName);
    if (features.length > 0) {
      viewParam.param = features[0];
    }
  }

}