/*List of shape to support
Circle
Ellipse
Line
Path (pencil brush)
Rect
Text direct placement
 */

//https://github.com/fabricjs/fabric.js/blob/master/packages/core/src good for figuring out how things work

let canvas = null;

function init(canvasElement) {
    console.log("init!")
    canvas = new fabric.Canvas(canvasElement);
    canvas.backgroundColor = "white";
    const helloWorld = new fabric.Text('Move ME!', {
        top: 50,
        left: 150
    });
    // canvas.add(helloWorld);

    helloWorld.left = 300
    helloWorld.setCoords()//this recalculates the selection box

    let selected = false

    //report the position of the thing as long as it is selected
    // helloWorld.onSelect = (event) => {
    //     selected = true;
    //     setTimeout(function report(){
    //         console.log(helloWorld.left+" "+helloWorld.top)
    //         if(selected) {
    //             setTimeout(report, 500)
    //         }
    //     },50)
    //     //force deselect an object
    //     setTimeout(()=>{canvas.discardActiveObject(); canvas.requestRenderAll();}, 5000)
    //     return false;
    // }
    //
    // //you get 1 chance to move this
    // helloWorld.onDeselect=(e)=> {
    //     helloWorld.selectable = false
    //     console.log("deselect")
    //     console.log(helloWorld)
    //     selected = false
    //     return false;
    // }

    canvas.isDrawingMode = false;//set to true to draw with the brush
    //set the brush that will be used in free drawing mode
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    // canvas.freeDrawingBrush = new RectangleBrush(canvas)

    /*
    let c = new fabric.Circle({
        left: 30,
        top: 80,
        radius: 50
    })
    c.setControlsVisibility({
        mt: false, // middle top
        mb: false, // middle bottom
        ml: false, // middle left
        mr: false  // middle right
    });
    canvas.add(c)

    canvas.add(new fabric.Textbox("sample text", {
        top: 100,
        left: 150,
        width: 200
    }))

    canvas.add(new fabric.Ellipse({
        left: 180,
        top: 80,
        rx: 50,
        ry: 30,
    }))

    canvas.add(new fabric.Rect({
        left: 330,
        top: 80,
        width: 50,
        height: 30
    }))

    canvas.add(new fabric.Line([
        460,
        80,
        500,
        110,
    ],{
        stroke: 'black',       // Must have a stroke color to be visible
        strokeWidth: 5,      // Must have a thickness > 0
    }))
    //*/

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
        let c = new fabric.Circle({
            left: this.mouseDown.x + width/2,
            top: this.mouseDown.y + height/2,
            radius: radius
        })
        c.setControlsVisibility({
            mt: false, // middle top
            mb: false, // middle bottom
            ml: false, // middle left
            mr: false  // middle right
        });
        canvas.add(c)

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

function distillCanvasItem(item){
    /*
    circle
textbox
ellipse
rect
line
path
     */
    let result = {
        selected: canvas.getActiveObjects().includes(item),
        type: item.type
    }
    switch (item.type){
        case 'circle':
            //x, y, radius, rotation, color
            result.x = item.left
            result.y = item.top
            result.radius = item.radius
            result.angle = item.angle
            result.color = item.fill
            break;
        case 'textbox':
            result.x = item.left
            result.y = item.top
            result.width = item.width
            result.height = item.height
            result.angle = item.angle
            result.color = item.fill
            result.text = item.text
            break;
        case 'ellipse':
            result.x = item.left
            result.y = item.top
            result.rx = item.rx * item.scaleX
            result.ry = item.ry * item.scaleY
            result.angle = item.angle
            result.color = item.fill
            break;
        case 'rect':
            result.x = item.left
            result.y = item.top
            result.width = item.width * item.scaleX
            result.height = item.height * item.scaleY
            result.angle = item.angle
            result.color = item.fill
            break;
        case 'line':
            result.x1 = item.x1
            result.y1 = item.y1
            result.x2 = item.x2
            result.y2 = item.y2
            result.color = item.stroke
            result.scaleX = item.scaleX
            result.scaleY = item.scaleY
            result.angle = item.angle
            break;
        case 'path':
            result.pathData = item.path
            result.angle = item.angle
            result.color = item.stroke
            result.scaleX = item.scaleX
            result.scaleY = item.scaleY
            break;
    }

    return result
}

function distillEntireCanvas(){
    result = []
    canvas.forEachObject((obj,index,arr) => {
        result[index] = distillCanvasItem(obj)
    })
    return result
}

function loadCanvasFromData(canvasData){
    canvas.clear()
    canvas.backgroundColor = "white";
    for(let i=0; i<canvasData.length; i++){
        canvas.add(loadItemFromData(canvasData[i]));
    }
}

function loadItemFromData(itemData){
    switch (itemData.type){
        case 'circle':
            let c = new fabric.Circle({
                left: itemData.x,
                top: itemData.y,
                radius: itemData.radius,
                fillColor: itemData.color,
                angle: itemData.angle,
                selectable: !itemData.selected
            })
            c.setControlsVisibility({
                mt: false, // middle top
                mb: false, // middle bottom
                ml: false, // middle left
                mr: false  // middle right
            });
            return c;
        case 'textbox':
            return new fabric.Textbox(itemData.text, {
                top: itemData.y,
                left: itemData.x,
                width: itemData.width,
                height: itemData.height,
                angle: itemData.angle,
                fill: itemData.color,
                selectable: !itemData.selected
            })
        case 'ellipse':
            return new fabric.Ellipse({
                left: itemData.x,
                top: itemData.y,
                rx: itemData.rx,
                ry: itemData.ry,
                angle: itemData.angle,
                fill: itemData.color,
                selectable: !itemData.selected
            })
        case 'rect':
            return new fabric.Rect({
                left: itemData.x,
                top: itemData.y,
                width: itemData.width,
                height: itemData.height,
                angle: itemData.angle,
                fill: itemData.color,
                selectable: !itemData.selected
            })
        case 'line':
            return new fabric.Line([
                itemData.x1,
                itemData.y1,
                itemData.x2,
                itemData.y2,
            ],{
                stroke: itemData.color,       // Must have a stroke color to be visible
                strokeWidth: 5,      // Must have a thickness > 0
                angle: itemData.angle,
                scaleX: itemData.scaleX,
                scaleY: itemData.scaleY,
                selectable: !itemData.selected
            })
        case 'path':
            return new fabric.Path(itemData.pathData,{
                angle: itemData.angle,
                stroke: itemData.color,
                scaleX: itemData.scaleX,
                scaleY: itemData.scaleY,
                fill: null,
                selectable: !itemData.selected
            })
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