/* */ 
(function(process) {
  (function(factory) {
    if (typeof module === 'object' && module.exports) {
      module.exports = factory;
    } else {
      factory(Highcharts);
    }
  }(function(H) {
    'use strict';
    var win = H.win,
        doc = win.document,
        noop = function() {},
        Color = H.Color,
        Series = H.Series,
        seriesTypes = H.seriesTypes,
        each = H.each,
        extend = H.extend,
        addEvent = H.addEvent,
        fireEvent = H.fireEvent,
        grep = H.grep,
        merge = H.merge,
        pick = H.pick,
        wrap = H.wrap,
        plotOptions = H.getOptions().plotOptions,
        CHUNK_SIZE = 50000,
        destroyLoadingDiv;
    function eachAsync(arr, fn, finalFunc, chunkSize, i) {
      i = i || 0;
      chunkSize = chunkSize || CHUNK_SIZE;
      var threshold = i + chunkSize,
          proceed = true;
      while (proceed && i < threshold && i < arr.length) {
        proceed = fn(arr[i], i);
        i = i + 1;
      }
      if (proceed) {
        if (i < arr.length) {
          setTimeout(function() {
            eachAsync(arr, fn, finalFunc, chunkSize, i);
          });
        } else if (finalFunc) {
          finalFunc();
        }
      }
    }
    each(['area', 'arearange', 'column', 'line', 'scatter'], function(type) {
      if (plotOptions[type]) {
        plotOptions[type].boostThreshold = 5000;
      }
    });
    each(['translate', 'generatePoints', 'drawTracker', 'drawPoints', 'render'], function(method) {
      function branch(proceed) {
        var letItPass = this.options.stacking && (method === 'translate' || method === 'generatePoints');
        if ((this.processedXData || this.options.data).length < (this.options.boostThreshold || Number.MAX_VALUE) || letItPass) {
          if (method === 'render' && this.image) {
            this.image.attr({href: ''});
            this.animate = null;
          }
          proceed.call(this);
        } else if (this[method + 'Canvas']) {
          this[method + 'Canvas']();
        }
      }
      wrap(Series.prototype, method, branch);
      if (method === 'translate') {
        if (seriesTypes.column) {
          wrap(seriesTypes.column.prototype, method, branch);
        }
        if (seriesTypes.arearange) {
          wrap(seriesTypes.arearange.prototype, method, branch);
        }
      }
    });
    wrap(Series.prototype, 'getExtremes', function(proceed) {
      if (!this.hasExtremes()) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
      }
    });
    wrap(Series.prototype, 'setData', function(proceed) {
      if (!this.hasExtremes(true)) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
      }
    });
    wrap(Series.prototype, 'processData', function(proceed) {
      if (!this.hasExtremes(true)) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
      }
    });
    H.extend(Series.prototype, {
      pointRange: 0,
      allowDG: false,
      hasExtremes: function(checkX) {
        var options = this.options,
            data = options.data,
            xAxis = this.xAxis && this.xAxis.options,
            yAxis = this.yAxis && this.yAxis.options;
        return data.length > (options.boostThreshold || Number.MAX_VALUE) && typeof yAxis.min === 'number' && typeof yAxis.max === 'number' && (!checkX || (typeof xAxis.min === 'number' && typeof xAxis.max === 'number'));
      },
      destroyGraphics: function() {
        var series = this,
            points = this.points,
            point,
            i;
        if (points) {
          for (i = 0; i < points.length; i = i + 1) {
            point = points[i];
            if (point && point.graphic) {
              point.graphic = point.graphic.destroy();
            }
          }
        }
        each(['graph', 'area', 'tracker'], function(prop) {
          if (series[prop]) {
            series[prop] = series[prop].destroy();
          }
        });
      },
      getContext: function() {
        var chart = this.chart,
            width = chart.plotWidth,
            height = chart.plotHeight,
            ctx = this.ctx,
            swapXY = function(proceed, x, y, a, b, c, d) {
              proceed.call(this, y, x, a, b, c, d);
            };
        if (!this.canvas) {
          this.canvas = doc.createElement('canvas');
          this.image = chart.renderer.image('', 0, 0, width, height).add(this.group);
          this.ctx = ctx = this.canvas.getContext('2d');
          if (chart.inverted) {
            each(['moveTo', 'lineTo', 'rect', 'arc'], function(fn) {
              wrap(ctx, fn, swapXY);
            });
          }
        } else {
          ctx.clearRect(0, 0, width, height);
        }
        this.canvas.width = width;
        this.canvas.height = height;
        this.image.attr({
          width: width,
          height: height
        });
        return ctx;
      },
      canvasToSVG: function() {
        this.image.attr({href: this.canvas.toDataURL('image/png')});
      },
      cvsLineTo: function(ctx, clientX, plotY) {
        ctx.lineTo(clientX, plotY);
      },
      renderCanvas: function() {
        var series = this,
            options = series.options,
            chart = series.chart,
            xAxis = this.xAxis,
            yAxis = this.yAxis,
            ctx,
            c = 0,
            xData = series.processedXData,
            yData = series.processedYData,
            rawData = options.data,
            xExtremes = xAxis.getExtremes(),
            xMin = xExtremes.min,
            xMax = xExtremes.max,
            yExtremes = yAxis.getExtremes(),
            yMin = yExtremes.min,
            yMax = yExtremes.max,
            pointTaken = {},
            lastClientX,
            sampling = !!series.sampling,
            points,
            r = options.marker && options.marker.radius,
            cvsDrawPoint = this.cvsDrawPoint,
            cvsLineTo = options.lineWidth ? this.cvsLineTo : false,
            cvsMarker = r <= 1 ? this.cvsMarkerSquare : this.cvsMarkerCircle,
            enableMouseTracking = options.enableMouseTracking !== false,
            lastPoint,
            threshold = options.threshold,
            yBottom = yAxis.getThreshold(threshold),
            hasThreshold = typeof threshold === 'number',
            translatedThreshold = yBottom,
            doFill = this.fill,
            isRange = series.pointArrayMap && series.pointArrayMap.join(',') === 'low,high',
            isStacked = !!options.stacking,
            cropStart = series.cropStart || 0,
            loadingOptions = chart.options.loading,
            requireSorting = series.requireSorting,
            wasNull,
            connectNulls = options.connectNulls,
            useRaw = !xData,
            minVal,
            maxVal,
            minI,
            maxI,
            fillColor = series.fillOpacity ? new Color(series.color).setOpacity(pick(options.fillOpacity, 0.75)).get() : series.color,
            stroke = function() {
              if (doFill) {
                ctx.fillStyle = fillColor;
                ctx.fill();
              } else {
                ctx.strokeStyle = series.color;
                ctx.lineWidth = options.lineWidth;
                ctx.stroke();
              }
            },
            drawPoint = function(clientX, plotY, yBottom) {
              if (c === 0) {
                ctx.beginPath();
              }
              if (wasNull) {
                ctx.moveTo(clientX, plotY);
              } else {
                if (cvsDrawPoint) {
                  cvsDrawPoint(ctx, clientX, plotY, yBottom, lastPoint);
                } else if (cvsLineTo) {
                  cvsLineTo(ctx, clientX, plotY);
                } else if (cvsMarker) {
                  cvsMarker(ctx, clientX, plotY, r);
                }
              }
              c = c + 1;
              if (c === 1000) {
                stroke();
                c = 0;
              }
              lastPoint = {
                clientX: clientX,
                plotY: plotY,
                yBottom: yBottom
              };
            },
            addKDPoint = function(clientX, plotY, i) {
              if (enableMouseTracking && !pointTaken[clientX + ',' + plotY]) {
                pointTaken[clientX + ',' + plotY] = true;
                if (chart.inverted) {
                  clientX = xAxis.len - clientX;
                  plotY = yAxis.len - plotY;
                }
                points.push({
                  clientX: clientX,
                  plotX: clientX,
                  plotY: plotY,
                  i: cropStart + i
                });
              }
            };
        if (this.points || this.graph) {
          this.destroyGraphics();
        }
        series.plotGroup('group', 'series', series.visible ? 'visible' : 'hidden', options.zIndex, chart.seriesGroup);
        series.getAttribs();
        series.markerGroup = series.group;
        addEvent(series, 'destroy', function() {
          series.markerGroup = null;
        });
        points = this.points = [];
        ctx = this.getContext();
        series.buildKDTree = noop;
        if (rawData.length > 99999) {
          chart.options.loading = merge(loadingOptions, {
            labelStyle: {
              backgroundColor: 'rgba(255,255,255,0.75)',
              padding: '1em',
              borderRadius: '0.5em'
            },
            style: {
              backgroundColor: 'none',
              opacity: 1
            }
          });
          clearTimeout(destroyLoadingDiv);
          chart.showLoading('Drawing...');
          chart.options.loading = loadingOptions;
        }
        eachAsync(isStacked ? series.data : (xData || rawData), function(d, i) {
          var x,
              y,
              clientX,
              plotY,
              isNull,
              low,
              chartDestroyed = typeof chart.index === 'undefined',
              isYInside = true;
          if (!chartDestroyed) {
            if (useRaw) {
              x = d[0];
              y = d[1];
            } else {
              x = d;
              y = yData[i];
            }
            if (isRange) {
              if (useRaw) {
                y = d.slice(1, 3);
              }
              low = y[0];
              y = y[1];
            } else if (isStacked) {
              x = d.x;
              y = d.stackY;
              low = y - d.y;
            }
            isNull = y === null;
            if (!requireSorting) {
              isYInside = y >= yMin && y <= yMax;
            }
            if (!isNull && x >= xMin && x <= xMax && isYInside) {
              clientX = Math.round(xAxis.toPixels(x, true));
              if (sampling) {
                if (minI === undefined || clientX === lastClientX) {
                  if (!isRange) {
                    low = y;
                  }
                  if (maxI === undefined || y > maxVal) {
                    maxVal = y;
                    maxI = i;
                  }
                  if (minI === undefined || low < minVal) {
                    minVal = low;
                    minI = i;
                  }
                }
                if (clientX !== lastClientX) {
                  if (minI !== undefined) {
                    plotY = yAxis.toPixels(maxVal, true);
                    yBottom = yAxis.toPixels(minVal, true);
                    drawPoint(clientX, hasThreshold ? Math.min(plotY, translatedThreshold) : plotY, hasThreshold ? Math.max(yBottom, translatedThreshold) : yBottom);
                    addKDPoint(clientX, plotY, maxI);
                    if (yBottom !== plotY) {
                      addKDPoint(clientX, yBottom, minI);
                    }
                  }
                  minI = maxI = undefined;
                  lastClientX = clientX;
                }
              } else {
                plotY = Math.round(yAxis.toPixels(y, true));
                drawPoint(clientX, plotY, yBottom);
                addKDPoint(clientX, plotY, i);
              }
            }
            wasNull = isNull && !connectNulls;
            if (i % CHUNK_SIZE === 0) {
              series.canvasToSVG();
            }
          }
          return !chartDestroyed;
        }, function() {
          var loadingDiv = chart.loadingDiv,
              loadingShown = chart.loadingShown;
          stroke();
          series.canvasToSVG();
          fireEvent(series, 'renderedCanvas');
          if (loadingShown) {
            extend(loadingDiv.style, {
              transition: 'opacity 250ms',
              opacity: 0
            });
            chart.loadingShown = false;
            destroyLoadingDiv = setTimeout(function() {
              if (loadingDiv.parentNode) {
                loadingDiv.parentNode.removeChild(loadingDiv);
              }
              chart.loadingDiv = chart.loadingSpan = null;
            }, 250);
          }
          series.directTouch = false;
          series.options.stickyTracking = true;
          delete series.buildKDTree;
          series.buildKDTree();
        }, chart.renderer.forExport ? Number.MAX_VALUE : undefined);
      }
    });
    seriesTypes.scatter.prototype.cvsMarkerCircle = function(ctx, clientX, plotY, r) {
      ctx.moveTo(clientX, plotY);
      ctx.arc(clientX, plotY, r, 0, 2 * Math.PI, false);
    };
    seriesTypes.scatter.prototype.cvsMarkerSquare = function(ctx, clientX, plotY, r) {
      ctx.rect(clientX - r, plotY - r, r * 2, r * 2);
    };
    seriesTypes.scatter.prototype.fill = true;
    extend(seriesTypes.area.prototype, {
      cvsDrawPoint: function(ctx, clientX, plotY, yBottom, lastPoint) {
        if (lastPoint && clientX !== lastPoint.clientX) {
          ctx.moveTo(lastPoint.clientX, lastPoint.yBottom);
          ctx.lineTo(lastPoint.clientX, lastPoint.plotY);
          ctx.lineTo(clientX, plotY);
          ctx.lineTo(clientX, yBottom);
        }
      },
      fill: true,
      fillOpacity: true,
      sampling: true
    });
    extend(seriesTypes.column.prototype, {
      cvsDrawPoint: function(ctx, clientX, plotY, yBottom) {
        ctx.rect(clientX - 1, plotY, 1, yBottom - plotY);
      },
      fill: true,
      sampling: true
    });
    Series.prototype.getPoint = function(boostPoint) {
      var point = boostPoint;
      if (boostPoint && !(boostPoint instanceof this.pointClass)) {
        point = (new this.pointClass()).init(this, this.options.data[boostPoint.i]);
        point.category = point.x;
        point.dist = boostPoint.dist;
        point.distX = boostPoint.distX;
        point.plotX = boostPoint.plotX;
        point.plotY = boostPoint.plotY;
      }
      return point;
    };
    wrap(Series.prototype, 'destroy', function(proceed) {
      var series = this,
          chart = series.chart;
      if (chart.hoverPoints) {
        chart.hoverPoints = grep(chart.hoverPoints, function(point) {
          return point.series === series;
        });
      }
      if (chart.hoverPoint && chart.hoverPoint.series === series) {
        chart.hoverPoint = null;
      }
      proceed.call(this);
    });
    wrap(Series.prototype, 'searchPoint', function(proceed) {
      return this.getPoint(proceed.apply(this, [].slice.call(arguments, 1)));
    });
  }));
})(require('process'));
