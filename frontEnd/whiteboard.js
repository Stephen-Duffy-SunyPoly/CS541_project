/*List of shape to support
Circle
Ellipse
Line
Path (pencil brush)
Rect
Text
 */

//https://github.com/fabricjs/fabric.js/blob/master/packages/core/src good for figuring out how things work

let canvas = null;

function init(canvasElement) {
    console.log("init!")
    canvas = new fabric.Canvas(canvasElement);
    const helloWorld = new fabric.Text('Move ME!', {
        top: 50,
        left: 150
    });
    canvas.add(helloWorld);

    helloWorld.left = 300
    helloWorld.setCoords()//this recalculates the selection box

    let selected = false

    //report the position of the thing as long as it is selected
    helloWorld.onSelect = (event) => {
        selected = true;
        setTimeout(function report(){
            console.log(helloWorld.left+" "+helloWorld.top)
            if(selected) {
                setTimeout(report, 500)
            }
        },50)
        //force deselect an object
        setTimeout(()=>{canvas.discardActiveObject(); canvas.requestRenderAll();}, 5000)
        return false;
    }

    //you get 1 chance to move this
    helloWorld.onDeselect=(e)=> {
        helloWorld.selectable = false
        console.log("deselect")
        console.log(helloWorld)
        selected = false
        return false;
    }

    canvas.isDrawingMode = true;//set to true to draw with the brush
    //set the brush that will be used in free drawing mode
    // canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush = new RectangleBrush(canvas)

    canvas.on('path:created', function(opt) {
        const newlyCreatedPath = opt.path;

        // Access or modify the path object
        console.log('Path created:', newlyCreatedPath);

        // Example: assign a custom property or ID
        newlyCreatedPath.set({
            selectable: true,
            strokeLineCap: 'round'
        });
        canvas.isDrawingMode = false;
    });

    //operation on each object in the scene
    // canvas.forEachObject((obj,index,arr) => {
    //     console.log(obj.type)
    //     console.log(obj);
    // })

    //check if an object is currently selected
    // canvas.getActiveObjects().includes(obj)

}


class CircleBrush extends fabric.BaseBrush{
    constructor(canvas) {
        super(canvas);
        this.mouseDown = {x:0,y:0}
        this.mouseUp = {x:0,y:0}
    }

    _render(ctx){
        this.canvas.clearContext(this.canvas.contextTop);
        if(!ctx){
            ctx = this.canvas.contextTop
        }

        let width = this.mouseUp.x - this.mouseDown.x;
        let height = this.mouseUp.y - this.mouseDown.y;
        let radius = Math.min(Math.abs(width/2), Math.abs(height/2));
        ctx.save()
        ctx.beginPath();
        ctx.arc(this.mouseDown.x+width/2,this.mouseDown.y+height/2,radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill()
        ctx.restore()
    }

    onMouseDown(pointer, ev){
        this.mouseDown = pointer;
        this.mouseUp = pointer;
    }

    onMouseMove(pointer, ev){
        this.mouseUp = pointer;
        //draw the preview
        this._render()
    }

    onMouseUp(ev){

        //remove thew preview from the screen
        this.canvas.clearContext(this.canvas.contextTop);
        let width = this.mouseUp.x - this.mouseDown.x;
        let height = this.mouseUp.y - this.mouseDown.y;
        let radius = Math.min(Math.abs(width/2), Math.abs(height/2));;

        //add the finished object to the canvas here, also notify the server that a new object was added!
        canvas.add(new fabric.Circle({
            left: this.mouseDown.x + width/2,
            top: this.mouseDown.y + height/2,
            radius: radius,
        }))

        //optional turn the drawing off to allow for the editing of what was drawn
        canvas.isDrawingMode = false;
    }
}

class EllipseBrush extends fabric.BaseBrush{
    constructor(canvas) {
        super(canvas);
        this.mouseDown = {x:0,y:0}
        this.mouseUp = {x:0,y:0}
    }

    _render(ctx){
        this.canvas.clearContext(this.canvas.contextTop);
        if(!ctx){
            ctx = this.canvas.contextTop
        }

        let width = this.mouseUp.x - this.mouseDown.x;
        let height = this.mouseUp.y - this.mouseDown.y;
        let rx = width/2;
        let ry = height/2;
        ctx.beginPath();
        ctx.save()
        /*Create a matrix of the following:
            a c e
            b d f
            0 0 1
         */
        //scale in the y-axis by the aspect ratio
        let aspectRatio = ry / rx
        ctx.transform(1, 0, 0, aspectRatio, 0, 0);
        ctx.arc(this.mouseDown.x+width/2,(this.mouseDown.y+height/2)/aspectRatio, Math.abs(rx), 0, 2 * Math.PI);
        ctx.restore()
        ctx.closePath();
        ctx.fill()
    }

    onMouseDown(pointer, ev){
        this.mouseDown = pointer;
        this.mouseUp = pointer;
    }

    onMouseMove(pointer, ev){
        this.mouseUp = pointer;
        //draw the preview
        this._render()
    }

    onMouseUp(ev){

        //remove thew preview from the screen
        this.canvas.clearContext(this.canvas.contextTop);
        let width = this.mouseUp.x - this.mouseDown.x;
        let height = this.mouseUp.y - this.mouseDown.y;
        let rx = width/2;
        let ry = height/2;

        //add the finished object to the canvas here, also notify the server that a new object was added!
        canvas.add(new fabric.Ellipse({
            left: this.mouseDown.x + width/2,
            top: this.mouseDown.y + height/2,
            rx: rx,
            ry: ry,
        }))

        //optional turn the drawing off to allow for the editing of what was drawn
        canvas.isDrawingMode = false;
    }
}

class LineBrush extends fabric.BaseBrush{
    constructor(canvas) {
        super(canvas);
        this.mouseDown = {x:0,y:0}
        this.mouseUp = {x:0,y:0}
    }

    _render(ctx){
        this.canvas.clearContext(this.canvas.contextTop);
        if(!ctx){
            ctx = this.canvas.contextTop
        }
        ctx.beginPath()
        ctx.moveTo(this.mouseDown.x, this.mouseDown.y);
        ctx.lineTo(this.mouseUp.x, this.mouseUp.y);
        ctx.closePath()
        ctx.stroke()
    }

    onMouseDown(pointer, ev){
        this.mouseDown = pointer;
        this.mouseUp = pointer;
    }

    onMouseMove(pointer, ev){
        this.mouseUp = pointer;
        //draw the preview
        this._render()
    }

    onMouseUp(ev){

        //remove thew preview from the screen
        this.canvas.clearContext(this.canvas.contextTop);
        let width = this.mouseUp.x - this.mouseDown.x;
        let height = this.mouseUp.y - this.mouseDown.y;

        //add the finished object to the canvas here, also notify the server that a new object was added!
        canvas.add(new fabric.Line([
            this.mouseDown.x,
            this.mouseDown.y,
            this.mouseUp.x,
            this.mouseUp.y,
        ],{
            stroke: 'black',       // Must have a stroke color to be visible
            strokeWidth: 5,      // Must have a thickness > 0
        }))

        //optional turn the drawing off to allow for the editing of what was drawn
        canvas.isDrawingMode = false;
    }
}

class RectangleBrush extends fabric.BaseBrush{
    constructor(canvas) {
        super(canvas);
        this.mouseDown = {x:0,y:0}
        this.mouseUp = {x:0,y:0}
    }

    _render(ctx){
        this.canvas.clearContext(this.canvas.contextTop);
        if(!ctx){
            ctx = this.canvas.contextTop
        }
        let width = this.mouseUp.x - this.mouseDown.x;
        let height = this.mouseUp.y - this.mouseDown.y;
        ctx.fillRect(this.mouseDown.x, this.mouseDown.y, width, height);
        //in progress drawing commands here
    }

    onMouseDown(pointer, ev){
        this.mouseDown = pointer;
        this.mouseUp = pointer;
    }

    onMouseMove(pointer, ev){
        this.mouseUp = pointer;
        //draw the preview
        this._render()
    }

    onMouseUp(ev){

        //remove thew preview from the screen
        this.canvas.clearContext(this.canvas.contextTop);
        let width = this.mouseUp.x - this.mouseDown.x;
        let height = this.mouseUp.y - this.mouseDown.y;

        //add the finished object to the canvas here, also notify the server that a new object was added!
        canvas.add(new fabric.Rect({
            left: this.mouseDown.x + width/2,
            top: this.mouseUp.y -height/2,
            width: width,
            height: height
        }))

        //optional turn the drawing off to allow for the editing of what was drawn
        canvas.isDrawingMode = false;
    }
}



// class BrushSkeleton extends fabric.BaseBrush{
//     constructor(canvas) {
//         super(canvas);
//         this.mouseDown = {x:0,y:0}
//         this.mouseUp = {x:0,y:0}
//     }
//
//     _render(ctx){
//         this.canvas.clearContext(this.canvas.contextTop);
//         if(!ctx){
//             ctx = this.canvas.contextTop
//         }
//         //in progress drawing commands here
//     }
//
//     onMouseDown(pointer, ev){
//         this.mouseDown = pointer;
//         this.mouseUp = pointer;
//     }
//
//     onMouseMove(pointer, ev){
//         this.mouseUp = pointer;
//         //draw the preview
//         this._render()
//     }
//
//     onMouseUp(ev){
//
//         //remove thew preview from the screen
//         this.canvas.clearContext(this.canvas.contextTop);
//         let width = this.mouseUp.x - this.mouseDown.x;
//         let height = this.mouseUp.y - this.mouseDown.y;
//
//         //add the finished object to the canvas here, also notify the server that a new object was added!
//
//         //optional turn the drawing off to allow for the editing of what was drawn
//         canvas.isDrawingMode = false;
//     }
// }