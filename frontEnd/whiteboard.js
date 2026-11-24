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
let revision = 0;
let deleteMode = false;
function init(canvasElement) {
    console.log("init!")
    canvas = new fabric.Canvas(canvasElement);
    canvas.backgroundColor = "white";
    canvas.selection = false
    // const helloWorld = new fabric.Text('Move ME!', {
    //     top: 50,
    //     left: 150
    // });

    // canvas.add(helloWorld);

    // helloWorld.left = 300
    // helloWorld.setCoords()//this recalculates the selection box

    // let selected = false

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

        // Example: assign a custom property or ID
        newlyCreatedPath.set({
            selectable: true,
            strokeLineCap: 'round'
        });
        canvas.isDrawingMode = false;
        createNewItem(newlyCreatedPath);
        canvas.remove(newlyCreatedPath);
        canvas.renderAll();
    });

    canvas.on("selection:updated", selectionMade)
    canvas.on("selection:created", selectionMade)

    //operation on each object in the scene
    // canvas.forEachObject((obj,index,arr) => {
    //     console.log(obj.type)
    //     console.log(obj);
    // })

    //check if an object is currently selected
    // canvas.getActiveObjects().includes(obj)

}

function selectionMade(event){
    if(deleteMode) {
        let item = event.selected[0]
        let index = -1
        for (let i = 0; i < canvas.size(); i++) {
            if (canvas.item(i) === item) {
                index = i;
                break;
            }
        }
        let json = distillCanvasItem(item);
        canvas.remove(item)
        console.log(index);
        //TODO send the delete command to the server
        fetch("whiteboards/delete",{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item: json,
                board: boardId,
                revised: revision,
                index: index
            })
        })
    }
}

function updateLoop(){
    fetch("whiteboardContent?id=" + boardId).then(res => {
        if (res.ok) {
            res.json().then(data => {
                //go through every item,
                let i;
                for(i = 0; i < data.items.length; i++) {
                    let dataItem = data.items[i];
                    if(i<canvas.size()) {
                        let onCanvas = canvas.item(i);
                        //if the corresponding item has been selected then skip this item
                        if (canvas.getActiveObjects().includes(onCanvas)) {
                            continue;
                        }
                        //if the corresponding item on the canvas has a different type,
                        if (onCanvas.type !== dataItem.type) {
                            //remove the canvas item
                            canvas.remove(onCanvas);
                            //start the loop over but do not change the subject item
                            i--;
                            continue;
                        }
                        //if the canvas item has a different timestamp
                        if((dataItem.timestamp === undefined || dataItem.timestamp == null || onCanvas.modified === undefined ||
                            onCanvas.modified === null || dataItem.timestamp > onCanvas.modified || dataItem.selected !== onCanvas.selectable)) {
                            if (canvas.getActiveObjects().includes(onCanvas)) {
                                continue;
                            }
                            // console.log(dataItem.timestamp, onCanvas.modified,canvas.getActiveObjects().includes(onCanvas))
                            //set the new item content
                            let updatedItem = loadItemFromData(dataItem)
                            updatedItem.modified = dataItem.timestamp
                            canvas.item(i).set(updatedItem)
                            canvas.item(i).setCoords();
                            canvas.renderAll()
                        }
                    } else {//if the end of the canvas has been reached
                        //add new items to the canvas
                        let item = loadItemFromData(dataItem)
                        itemAdded(item);
                        canvas.add(item);
                    }
                    revision = data.revised
                }
                while(i < canvas.size()) {
                    let item = canvas.item(canvas.size()-1)
                    console.log("Remove")
                    canvas.remove(item)
                }
                // if(data.items.length !== canvas.size()) {
                //     // if items were added or removed
                //     if(revision !== data.revised){
                //         revision = data.revised
                //     }
                //     if(data.items.length > canvas.size()){//new items
                //         for(let i = canvas.size();i<data.items.length;i++){
                //             let item = loadItemFromData(data.items[i])
                //             itemAdded(item);
                //             canvas.add(item);
                //         }
                //     }
                // } else {
                //     for(let i = 0; i < data.items.length; i++) {
                //         let item = data.items[i]
                //         let onCanvas = canvas.item(i)
                //         // console.log(item.timestamp,onCanvas.modified, i)
                //         if(!canvas.getActiveObjects().includes(onCanvas) && (item.timestamp === undefined || item.timestamp == null || onCanvas.modified === undefined || onCanvas.modified === null || item.timestamp > onCanvas.modified
                //         || item.selected !== onCanvas.selectable)) {
                //             let updatedItem = loadItemFromData(item)
                //             updatedItem.modified = item.timestamp
                //             canvas.item(i).set(updatedItem)
                //             canvas.item(i).setCoords();
                //             canvas.renderAll()
                //         }
                //     }
                // }
            });

        }
    })
    setTimeout(updateLoop, 500)
}

function itemAdded(item){
    function syncItemWithServer() {
        let index = -1
        for (let i = 0; i < canvas.size(); i++) {
            if (canvas.item(i) === item) {
                index = i;
                break;
            }
        }
        console.log(-1);
        item.modified = Date.now()
        // send modification info to the server
        fetch("/whiteboards/modify", {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                type: "modify",
                index: index,
                board: boardId,
                item: distillCanvasItem(item),
                revised: revision,
            })
        })
    }
    // report the position of the thing as long as it is selected
    let selected = false;
    item.modified = Date.now()
    item.onSelect = (event) => {
        selected = true;
        //sending a modify command after having just deleted the item is not good, so dont do it

        setTimeout(function report() {
            // console.log(item.left+" "+item.top)
            // find the index of this item
            if(!deleteMode) {
                syncItemWithServer();
                if (selected) {
                    setTimeout(report, 500)
                }
            }
        }, 50)

        //force deselect an object
        // setTimeout(()=>{canvas.discardActiveObject(); canvas.requestRenderAll();}, 5000)
        return false;
    }


    item.onDeselect=(e)=> {
        console.log("deselect")
        selected = false
        if(!deleteMode) {
            syncItemWithServer();
        }
        return false;
    }
}

function createNewItem(item){
    fetch("/whiteboards/add",{
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            board: boardId,
            item: distillCanvasItem(item),
        })
    })
}

function setMode(newMode){
    let selectButton = document.getElementById("selectButton");
    let circleButton = document.getElementById("circleButton");
    let ellipseButton = document.getElementById("ellipseButton");
    let lineButton = document.getElementById("lineButton");
    let rectangleButton = document.getElementById("rectangleButton");
    let pathButton = document.getElementById("pathButton");
    let deleteButton = document.getElementById("deleteButton");
    //enable all the mode buttons
    selectButton.disabled = false
    circleButton.disabled = false
    ellipseButton.disabled = false
    lineButton.disabled = false
    rectangleButton.disabled = false
    pathButton.disabled = false
    deleteButton.disabled = false
    deleteMode = false;

    //diable this mode button
    //set the appropriate drawing brush and mode
    switch(newMode) {
        case "select":
            selectButton.disabled = true
            canvas.isDrawingMode = false;
            break;
        case "circle":
            circleButton.disabled = true
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new CircleBrush(canvas)
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            break;
        case "ellipse":
            ellipseButton.disabled = true
            canvas.isDrawingMode = true
            canvas.freeDrawingBrush = new EllipseBrush(canvas)
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            break;
        case "line":
            lineButton.disabled = true
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new LineBrush(canvas)
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            break;
        case "rectangle":
            rectangleButton.disabled = true
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new RectangleBrush(canvas)
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            break;
        case "path":
            pathButton.disabled = true
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            break;
        case "delete":
            deleteButton.disabled = true
            canvas.isDrawingMode = false;
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            deleteMode = true;
            break;
    }


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
        createNewItem(c)

        //optional turn the drawing off to allow for the editing of what was drawn
        setMode("select")
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
        createNewItem(new fabric.Ellipse({
            left: this.mouseDown.x + width/2,
            top: this.mouseDown.y + height/2,
            rx: rx,
            ry: ry,
        }))

        //optional turn the drawing off to allow for the editing of what was drawn
        setMode("select")
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
        createNewItem(new fabric.Line([
            this.mouseDown.x,
            this.mouseDown.y,
            this.mouseUp.x,
            this.mouseUp.y,
        ],{
            stroke: 'black',       // Must have a stroke color to be visible
            strokeWidth: 5,      // Must have a thickness > 0
        }))

        //optional turn the drawing off to allow for the editing of what was drawn
        setMode("select")
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
        createNewItem(new fabric.Rect({
            left: this.mouseDown.x + width/2,
            top: this.mouseUp.y -height/2,
            width: width,
            height: height
        }))

        //optional turn the drawing off to allow for the editing of what was drawn
        setMode("select")
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
            result.radius = item.radius * item.scaleX
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
            const points = item.calcLinePoints();
            const matrix = item.calcTransformMatrix();

            const p1 = new fabric.Point(points.x1, points.y1);
            const p2 = new fabric.Point(points.x2, points.y2);

            const point1 = fabric.util.transformPoint(p1, matrix);
            const point2 = fabric.util.transformPoint(p2, matrix);

            result.x1 = point1.x;
            result.y1 = point1.y;
            result.x2 = point2.x;
            result.y2 = point2.y;
            result.color = item.stroke
            result.strokeWidth = item.strokeWidth;

            break;
        case 'path':
            result.pathData = item.path
            result.angle = item.angle
            result.color = item.stroke
            result.scaleX = item.scaleX
            result.scaleY = item.scaleY
            result.left = item.left;
            result.top = item.top;
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
        let item = loadItemFromData(canvasData[i])
        canvas.add(item);
        itemAdded(item)
    }
}

function loadItemFromData(itemData){
    switch (itemData.type){
        case 'circle':
            let c = new fabric.Circle({
                left: itemData.x,
                top: itemData.y,
                radius: Math.abs(itemData.radius),
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
                rx: Math.abs(itemData.rx),
                ry: Math.abs(itemData.ry),
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
                stroke: itemData.color,
                strokeWidth: itemData.strokeWidth,//TODO make the width not change with scaling
                selectable: !itemData.selected
            })
        case 'path':
            return new fabric.Path(itemData.pathData,{
                angle: itemData.angle,
                stroke: itemData.color,
                scaleX: itemData.scaleX,
                scaleY: itemData.scaleY,
                fill: null,
                selectable: !itemData.selected,
                left: itemData.left,
                top: itemData.top,
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