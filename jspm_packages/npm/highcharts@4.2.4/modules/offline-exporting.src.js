/* */ 
(function(process) {
  (function(factory) {
    if (typeof module === 'object' && module.exports) {
      module.exports = factory;
    } else {
      factory(Highcharts);
    }
  }(function(Highcharts) {
    var win = Highcharts.win,
        nav = win.navigator,
        doc = win.document;
    Highcharts.CanVGRenderer = {};
    function getScript(scriptLocation, callback) {
      var head = doc.getElementsByTagName('head')[0],
          script = doc.createElement('script');
      script.type = 'text/javascript';
      script.src = scriptLocation;
      script.onload = callback;
      head.appendChild(script);
    }
    Highcharts.Chart.prototype.exportChartLocal = function(exportingOptions, chartOptions) {
      var chart = this,
          options = Highcharts.merge(chart.options.exporting, exportingOptions),
          webKit = nav.userAgent.indexOf('WebKit') > -1 && nav.userAgent.indexOf('Chrome') < 0,
          scale = options.scale || 2,
          chartCopyContainer,
          domurl = win.URL || win.webkitURL || win,
          images,
          imagesEmbedded = 0,
          el,
          i,
          l,
          fallbackToExportServer = function() {
            if (options.fallbackToExportServer === false) {
              if (options.error) {
                options.error();
              } else {
                throw 'Fallback to export server disabled';
              }
            } else {
              chart.exportChart(options);
            }
          },
          imageToDataUrl = function(imageURL, callbackArgs, successCallback, taintedCallback, noCanvasSupportCallback, failedLoadCallback, finallyCallback) {
            var img = new win.Image(),
                taintedHandler,
                loadHandler = function() {
                  var canvas = doc.createElement('canvas'),
                      ctx = canvas.getContext && canvas.getContext('2d'),
                      dataURL;
                  try {
                    if (!ctx) {
                      noCanvasSupportCallback(imageURL, callbackArgs);
                    } else {
                      canvas.height = img.height * scale;
                      canvas.width = img.width * scale;
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                      try {
                        dataURL = canvas.toDataURL();
                        successCallback(dataURL, callbackArgs);
                      } catch (e) {
                        if (e.name === 'SecurityError' || e.name === 'SECURITY_ERR' || e.message === 'SecurityError') {
                          taintedHandler(imageURL, callbackArgs);
                        } else {
                          throw e;
                        }
                      }
                    }
                  } finally {
                    if (finallyCallback) {
                      finallyCallback(imageURL, callbackArgs);
                    }
                  }
                },
                errorHandler = function() {
                  failedLoadCallback(imageURL, callbackArgs);
                  if (finallyCallback) {
                    finallyCallback(imageURL, callbackArgs);
                  }
                };
            taintedHandler = function() {
              img = new win.Image();
              taintedHandler = taintedCallback;
              img.crossOrigin = 'Anonymous';
              img.onload = loadHandler;
              img.onerror = errorHandler;
              img.src = imageURL;
            };
            img.onload = loadHandler;
            img.onerror = errorHandler;
            img.src = imageURL;
          },
          svgToDataUrl = function(svg) {
            try {
              if (!webKit && nav.userAgent.toLowerCase().indexOf('firefox') < 0) {
                return domurl.createObjectURL(new win.Blob([svg], {type: 'image/svg+xml;charset-utf-16'}));
              }
            } catch (e) {}
            return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
          },
          download = function(dataURL, extension) {
            var a = doc.createElement('a'),
                filename = (options.filename || 'chart') + '.' + extension,
                windowRef;
            if (nav.msSaveOrOpenBlob) {
              nav.msSaveOrOpenBlob(dataURL, filename);
              return;
            }
            if (a.download !== undefined) {
              a.href = dataURL;
              a.download = filename;
              a.target = '_blank';
              doc.body.appendChild(a);
              a.click();
              doc.body.removeChild(a);
            } else {
              try {
                windowRef = win.open(dataURL, 'chart');
                if (windowRef === undefined || windowRef === null) {
                  throw 'Failed to open window';
                }
              } catch (e) {
                win.location.href = dataURL;
              }
            }
          },
          initiateDownload = function() {
            var svgurl,
                blob,
                svg = chart.sanitizeSVG(chartCopyContainer.innerHTML);
            if (options && options.type === 'image/svg+xml') {
              try {
                if (nav.msSaveOrOpenBlob) {
                  blob = new MSBlobBuilder();
                  blob.append(svg);
                  svgurl = blob.getBlob('image/svg+xml');
                } else {
                  svgurl = svgToDataUrl(svg);
                }
                download(svgurl, 'svg');
              } catch (e) {
                fallbackToExportServer();
              }
            } else {
              svgurl = svgToDataUrl(svg);
              imageToDataUrl(svgurl, {}, function(imageURL) {
                try {
                  download(imageURL, 'png');
                } catch (e) {
                  fallbackToExportServer();
                }
              }, function() {
                var canvas = doc.createElement('canvas'),
                    ctx = canvas.getContext('2d'),
                    imageWidth = svg.match(/^<svg[^>]*width\s*=\s*\"?(\d+)\"?[^>]*>/)[1] * scale,
                    imageHeight = svg.match(/^<svg[^>]*height\s*=\s*\"?(\d+)\"?[^>]*>/)[1] * scale,
                    downloadWithCanVG = function() {
                      ctx.drawSvg(svg, 0, 0, imageWidth, imageHeight);
                      try {
                        download(nav.msSaveOrOpenBlob ? canvas.msToBlob() : canvas.toDataURL('image/png'), 'png');
                      } catch (e) {
                        fallbackToExportServer();
                      }
                    };
                canvas.width = imageWidth;
                canvas.height = imageHeight;
                if (win.canvg) {
                  downloadWithCanVG();
                } else {
                  chart.showLoading();
                  getScript(Highcharts.getOptions().global.canvasToolsURL, function() {
                    chart.hideLoading();
                    downloadWithCanVG();
                  });
                }
              }, fallbackToExportServer, fallbackToExportServer, function() {
                try {
                  domurl.revokeObjectURL(svgurl);
                } catch (e) {}
              });
            }
          },
          embeddedSuccess = function(imageURL, callbackArgs) {
            ++imagesEmbedded;
            callbackArgs.imageElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageURL);
            if (imagesEmbedded === images.length) {
              initiateDownload();
            }
          };
      Highcharts.wrap(Highcharts.Chart.prototype, 'getChartHTML', function(proceed) {
        chartCopyContainer = this.container.cloneNode(true);
        return proceed.apply(this, Array.prototype.slice.call(arguments, 1));
      });
      chart.getSVGForExport(options, chartOptions);
      images = chartCopyContainer.getElementsByTagName('image');
      try {
        if (!images.length) {
          initiateDownload();
        }
        for (i = 0, l = images.length; i < l; ++i) {
          el = images[i];
          imageToDataUrl(el.getAttributeNS('http://www.w3.org/1999/xlink', 'href'), {imageElement: el}, embeddedSuccess, fallbackToExportServer, fallbackToExportServer, fallbackToExportServer);
        }
      } catch (e) {
        fallbackToExportServer();
      }
    };
    Highcharts.getOptions().exporting.buttons.contextButton.menuItems = [{
      textKey: 'printChart',
      onclick: function() {
        this.print();
      }
    }, {separator: true}, {
      textKey: 'downloadPNG',
      onclick: function() {
        this.exportChartLocal();
      }
    }, {
      textKey: 'downloadSVG',
      onclick: function() {
        this.exportChartLocal({type: 'image/svg+xml'});
      }
    }];
  }));
})(require('process'));
