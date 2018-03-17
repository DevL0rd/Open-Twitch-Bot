//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 8/22/2017
//Version: 1
var Rendering = {}
Rendering.setContext = function(context) {
	this.context = context
}
Rendering.render = function(type, x, y, params, context = Rendering.context) {
	if (type == "text"){
		if (params.str != null){
			//Apply all temp params
			if (params.fillStyle != null){
				var fillBKUP = context.fillStyle
				context.fillStyle = params.fillStyle
			}
			if (params.strokeStyle != null){
				var strokeBKUP = context.strokeStyle
				context.strokeStyle = params.strokeStyle
			}
			if (params.shadowColor != null){
				var shadowBKUP = context.shadowColor
				context.shadowColor = params.shadowColor
			}
			if (params.shadowOffsetX != null){
				var shadowOffsetXBKUP = params.shadowOffsetX
				context.shadowOffsetX = params.shadowOffsetX
			}
			if (params.shadowOffsetY != null){
				var shadowOffsetYBKUP = params.shadowOffsetY
				context.shadowOffsetY = params.shadowOffsetY
			}
			//getDrawMethod
			if (params.DrawMethod == null){
				params.DrawMethod = "fill"
			}
			//renderText
			if (params.DrawMethod == "fill"){
				context.fillText(params.str, x, y);
			} else if (params.DrawMethod == "stroke"){
				context.strokeText(params.str, x, y);
			}
			
			//Restore old params
			if (params.fillStyle != null){
				context.fillStyle = fillBKUP
			}
			if (params.strokeStyle != null){
				context.strokeStyle = strokeBKUP
			}
			if (params.shadowColor != null){
				context.shadowColor = shadowBKUP
			}
			if (params.shadowOffsetX != null){
				context.shadowOffsetX = shadowOffsetXBKUP
			}
			if (params.shadowOffsetY != null){
				context.shadowOffsetY = shadowOffsetYBKUP
			}
		}
	}
}