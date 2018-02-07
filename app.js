//Helper function to create elements in the DOM

//Takes 2 or more arguments, a name, an attributes object and
//the third argument onwards starts being a child node that os appended to the element
function elt(name, attributes){
  let node = document.createElement(name)
  if (attributes){
  //set all atributes in the attributes object
    for (let attr in attributes)
      if (attributes.hasOwnProperty(attr))
        //set attribute name and key in the node
        node.setAttribute(attr, attributes[attr])
  }
  //Append the optional arguments from 2 onwards as children of the Node
  for(let i = 2; i< arguments.length; i++){
    let child = arguments[i]
    //If its string, put it as text Node , else
    if (typeof child == "string")
      child = document.createTextNode(child)
    node.appendChild(child)
  }
  return node
}

//controls object that will initialize all the controls functions below the canvas
let controls = Object.create(null)

//fnction that creates paint layout
function createPaint(parent){
  let canvas = elt("canvas", {width:500, height: 300})
  let cx = canvas.getContext("2d")
  let toolbar = elt("div", {class:"toolbar"})

  //
  for(let name in controls)
  //controls[name] will be a function and cx its argument --> Each control has access to the canvas context
    toolbar.appendChild(controls[name](cx))

    //panel is div that will hold the canvas
    let panel = elt("div", {class: "picturepanel"}, canvas)
    //attach panel(canvas) and toolbar inside a div to the parent Node
    parent.appendChild(elt("div", null, panel, toolbar))
}

//Tools
//object that will store the different tools
let tools = Object.create(null)

//select that allows user to pick drawing tool
controls.tool = function(cx){
  let select = elt("select")
  //append options for tools
  for (let name in tools)
    select.appendChild(elt("option",null,name))

  //add event listener to events
  cx.canvas.addEventListener("mousedown", (event)=>{
    if (event.which == 1){
      //call the tool function we require
      tools[select.value](event,cx)
      //prevent default to avoid holding the mouse down has other unwanted effects
      event.preventDefault()
    }
  })
    return elt("span", null,"Tool: ", select)
}


//Mouse movements helpers

//function to track relative position of mouse in canvas
function relativePos(event, element){
  let rect = element.getBoundingClientRect()
  return {x: Math.floor(event.clientX - rect.left),
          y: Math.floor(event.clientY - rect.top)
        }
}

//drag tracking tool
//takes two functions. One to perform while when the mouse is held down, and the other for when its reeased
function trackDrag(onMove, onEnd){
  function end(event){
    removeEventListener("mousemove", onMove)
    removeEventListener("mouseup", end)
    if(onEnd)
      onEnd(event)
  }
  addEventListener("mousemove", onMove)
  addEventListener("mouseup", end)
}

//line Drawing tool (pencil)
tools.Line = function(event, cx, onEnd){
  //round type of line end in the context
  cx.lineCap = "round"

  let pos = relativePos(event, cx.canvas)
  //for every mousemove a line is drawn from the origin to the
  trackDrag((event)=>{
    cx.beginPath()
    //move to the position of the mouse
    cx.moveTo(pos.x,pos.y)
    //base position is reseted to new location of mouse, so that we can change where it is going
    //If not it would be drawing multiple lines from the original position where the mouse was clicked
    pos = relativePos(event, cx.canvas)
    //draw line
    cx.lineTo(pos.x, pos.y)
    cx.stroke()
    //onEnd is passed to trackDrag
  }, onEnd)
}
//by default globalCompositeOperation property ys source-over. This will mix the current color of the pixel with the one given.
//For the erase tool we need to set this property to destination-out, that will make the pixel transparent
tools.Erase = function(event, cx){
  //change property to make pixel transparent
  cx.globalCompositeOperation = "destination-out"

  //reset property value to source-over
  tools.Line(event, cx, ()=>{
    cx.globalCompositeOperation = "source-over"
  })
}

//color selection
//Most browsers have implemented color <input> types (Except explorer)
controls.color = function(cx){
  //input of color type html element
  let input = elt("input", {type:"color"})

  input.addEventListener("change", ()=>{
    //change fill and stroke style colors of the context
    cx.fillStyle = input.value
    cx.strokeStyle = input.value
  })
  //Not a pure function (has side effects)
  //returns a span with the same input
  return elt("span", null, "Color: ", input)
}

controls.brushSize = function(cx){
  let select = elt("select")
  let sizes = [1, 2, 3, 5, 8, 12, 25, 35, 50, 75, 100]

  sizes.forEach((size)=>{
    select.appendChild(elt("option", {value:size}, size + " pixels"))
  })
  select.addEventListener("change", ()=>{
    cx.lineWidth = select.value
  })
  return elt("span", null, "Brush size: ", select)

}

//Save . Use of data URL links to save the image
controls.save = function(cx){
  let link = elt("a", {href:"/"}, "Save")
  function update(){
    try {
      link.href = cx.canvas.toDataURL()
    } catch(e){
      if (r instanceof SecurityError)
      //browsers can mark a picture as 'tainted' if that image is not supposed to be read by a script.
      //Pixel information can't be extracted from a tainted canvas.
      //In this case we make the href point at another link, usind the javascript: protocol
      //These links execute the scipt after the colon: -- In this case an alert
        link.href = "javascrip:alert("+JSON.stringify("Cant Save: "+e.toString())+")"
        else
          throw e
    }
  }
  link.addEventListener("mouseover", update)
  link.addEventListener("focus", update)
  return link
}

//Loading images

//helper function to load image from URL
function loadImageUrl(cx, url){
  let image = document.createElement("img")
  image.addEventListener("load", ()=>{
    let color = cx.fillStyle, size = cx.lineWidth
    //change the size of the canvas according to our image
    cx.canvas.width = image.width
    cx.canvas.height = image.height
    cx.drawImage(image, 0, 0)
    //reset our configuration (whiped when changing the size)
    cx.fillStyle = color
    cx.strokeStyle = color
    cx.lineWidth = size
  })
  image.src = url
}

//control for local file loading
controls.openFile = function(cx){
  let input = elt("input", {type: "file"})

  input.addEventListener("change", ()=>{
    //if file is empty return
    if (input.files.length == 0) return

    let reader = new FileReader()

    //function to listen for the load of the file
    reader.addEventListener("load", ()=>{
      //when loaded, load Image into canvas with the data url
      loadImageUrl(cx, reader.result)
    })
    //trigger the load process
    reader.readAsDataURL(input.files[0])
  })
  return elt("div", null, "Open file: ", input)
}

//Load from internet URL
controls.openURL = function(cx){
  let input = elt("input", {type:"text"})
  let form = elt("form", null, "Open URL: ", input, elt("button", {type: "submit"},"load"))
  form.addEventListener("submit", ()=>{
    event.preventDefault()
    loadImageURL(cx, input.value)
  })
  return form
}

//Draw text tool

tools.Text = function(event, cx){
  let text = prompt("Text:", "")
  if (text){
    let pos = relativePos(event, cx.canvas)
    //minimun size 7 , otherwise unreadable
    cx.font = Math.max(7, cx.lineWidth)+ "px sans-serif"
    cx.fillText(text, pos.x, pos.y)
  }
}

//Spray tool

tools.Spray = function(event, cx){
  let radius = cx.lineWidth / 2
  let area = radius * radius * Math.PI
  let dotsPerTick = Math.ceil(area/30)

  let currentPos = relativePos(event, cx.canvas)

  let spray = setInterval(function(){
    for (let i =0; i<dotsPerTick; i++){
      //pich random points from the total amount and fill the Rect
      let offset = randomPointsInRadius(radius)
      cx.fillRect(currentPos.x + offset.x, currentPos.y + offset.y, 1, 1)
    }
  }, 25)
  //track the drag of the mouse
  trackDrag((event)=>{
    currentPos = relativePos(event, cx.canvas)
    }, ()=>{
      //clear interval when mouse is released (stop spraying)
      clearInterval(spray)
    }
  )
}

function randomPointsInRadius(radius){
  for(;;){
    let x = Math.random() * 2 - 1
    let y = Math.random() * 2 - 1
    if(x*x + y*y <= 1)
      return {x: x*radius, y: y*radius}
  }
}
