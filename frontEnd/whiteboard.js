/*List of shape to support
Circle
Ellipse
Line
Path
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
    canvas.freeDrawingBrush = new MyBrush(canvas)

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

class MyBrush extends fabric.BaseBrush{
    constructor(canvas) {
        super(canvas);
    }

    _render(ctx){
        this.canvas.clearContext(this.canvas.contextTop);
        if(!ctx){
            ctx = this.canvas.contextTop
        }
        ctx.fillRect(this.dp.x,this.dp.y,this.up.x-this.dp.x,this.up.y-this.dp.y)
        ctx.trans
        // ctx.render(ctx)
    }

    onMouseDown(pointer, ev){
        console.log("Mouse Down!!",pointer,ev);
        this.dp = pointer;
        this.up = pointer;
    }

    onMouseMove(pointer, ev){
        console.log("Mouse Move!!",pointer,ev);
        this.up = pointer;
        this._render()
    }

    onMouseUp(ev){
        console.log("Mouse Up!!",ev);
        this.canvas.clearContext(this.canvas.contextTop);
        let width = this.up.x-this.dp.x
        let height = this.up.y-this.dp.y
        this.canvas.add(new fabric.Rect({
            width: width,
            height: height,
            left: this.dp.x +width/2,//why is this necessary????
            top: this.dp.y + height/2,
        }))
        canvas.isDrawingMode = false;
    }
}