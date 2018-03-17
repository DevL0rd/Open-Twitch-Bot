	//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 8/22/2017
//Version: 1
	var Graphics = {}
	Graphics.newGraphicsObj = function (canvasID, context, nWidth, nHeight, funcRenderFrame, funcResize, dbg = false) {
	var newGraphicsOBJ = {}
	newGraphicsOBJ.debugenabled = dbg
    newGraphicsOBJ.NewFrameQueued = true;
    newGraphicsOBJ.PerformanceSampleRate = 10;
	newGraphicsOBJ.DrawDelay = 0;
    newGraphicsOBJ.ApproxMaxDrawDelay = 0;
    newGraphicsOBJ.PerformanceSampleTick = 0;
	newGraphicsOBJ.DrawRequestTime = 0;
	newGraphicsOBJ.RenderTimeMS = 0;
	newGraphicsOBJ.fps = 0;
	newGraphicsOBJ.QueueFrame = function () {
		this.NewFrameQueued = true;
	}
	newGraphicsOBJ.width = function (newWidth) {
		if (newWidth == null){
			return this.canvas.width;
		} else {
			this.canvas.width = newWidth
			this.NewFrameQueued = true;
		}
	}
	newGraphicsOBJ.height = function (newHeight) {
		if (newHeight == null){
			return this.canvas.height;
		} else {
			this.canvas.height = newHeight
			this.NewFrameQueued = true;
		}
	}
    newGraphicsOBJ.startTime = 0;
	newGraphicsOBJ.frameNumber = 0;
	newGraphicsOBJ.d = new Date().getTime();
	newGraphicsOBJ.canvas = document.getElementById(canvasID);
	newGraphicsOBJ.context = newGraphicsOBJ.canvas.getContext(context);
	newGraphicsOBJ.canvas.width = nWidth;
	newGraphicsOBJ.canvas.height = nHeight;
	newGraphicsOBJ.resize = funcResize;
    newGraphicsOBJ.RenderFrame = funcRenderFrame;
	
	return newGraphicsOBJ
	}
	Graphics.init = function (graphicsObj) {
            var now = new Date();
            if (graphicsObj.debugenabled) {
                if (graphicsObj.PerformanceSampleTick >= graphicsObj.PerformanceSampleRate) {
                    //Time to check performance
                    graphicsObj.PerformanceSampleTick = 0;
                    //Take current and subtract it with time of the last draw request
                    graphicsObj.DrawDelay = now - graphicsObj.DrawRequestTime;
                    var NewDrawDelay = graphicsObj.DrawDelay + graphicsObj.RenderTimeMS;
                    if (NewDrawDelay > graphicsObj.ApproxMaxDrawDelay) {
                        //If the draw delay is greater than the largest one recorded, update it if it changed by less than 3 or is = to 0
                        if (NewDrawDelay - graphicsObj.ApproxMaxDrawDelay < 3 || graphicsObj.ApproxMaxDrawDelay == 0) {
                            //If the delay increases to fast, this will be skipped,
                            graphicsObj.ApproxMaxDrawDelay = NewDrawDelay;
                        };
                    };
                } else {
                    graphicsObj.PerformanceSampleTick++;
                };
            };
			
            //Render frame
            if (graphicsObj.NewFrameQueued) {
                graphicsObj.NewFrameQueued = false;
				var fillStyleBKUP = graphicsObj.context.fillStyle
				graphicsObj.context.clearRect(0, 0, graphicsObj.canvas.width, graphicsObj.canvas.height)
                graphicsObj.RenderFrame(graphicsObj.canvas, graphicsObj.context);
				
				if (graphicsObj.debugenabled){
					var fillStyleBKUP = graphicsObj.context.fillStyle
					graphicsObj.context.fillStyle = "#f44242"
					graphicsObj.context.fillText(graphicsObj.fps, 10, 10)
					graphicsObj.context.fillStyle = fillStyleBKUP
				}
            }

            if (graphicsObj.debugenabled) {
                //keep track of FPS if debug is enabled
				graphicsObj.frameNumber++;
                graphicsObj.d = new Date().getTime(),
                currentTime = (graphicsObj.d - graphicsObj.startTime) / 1000,
                fpsnow = Math.floor((graphicsObj.frameNumber / currentTime));
                if (currentTime > 1) {
                    graphicsObj.startTime = new Date().getTime();
                    graphicsObj.frameNumber = 0;
                };
                if (graphicsObj.PerformanceSampleTick >= graphicsObj.PerformanceSampleRate) {
                    //if it is time to sample performance, update the FPS displayed on the debug menu.
                    graphicsObj.fps = fpsnow;
                    //Calculate how long it took to render the frame
                    graphicsObj.RenderTimeMS = new Date();
                    graphicsObj.RenderTimeMS = graphicsObj.RenderTimeMS - now;
                    if (graphicsObj.RenderTimeMS > graphicsObj.ApproxMaxDrawDelay) {
                        //Updatehighest time for rendering
                        graphicsObj.RenderTimeMS = graphicsObj.ApproxMaxDrawDelay;
                    };
                };
            };
            //Request the next animation frame asynchronously from the browser.
            requestAnimationFrame(function () {Graphics.init(graphicsObj)});
			
            if (graphicsObj.debugenabled) {
                if (graphicsObj.PerformanceSampleTick >= graphicsObj.PerformanceSampleRate) {
                    //if it is time to sample performance
                    //record the time the last frame finished rendering.
                    graphicsObj.DrawRequestTime = new Date();
                };
            };

        }
		


