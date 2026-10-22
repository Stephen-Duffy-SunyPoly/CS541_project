function init(canvasElement) {
    console.log("init!")
    const canvas = new fabric.Canvas(canvasElement);
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



}