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
function createPain(parent){
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
