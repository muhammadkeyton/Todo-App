const task = document.querySelector("input#input")
const todos = document.querySelector("main .all-todos")

task.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      if (task.value.length == 0) {
        alert("Insira um valor!")
      } else {
        card = document.createElement("div")
        cardBody = document.createElement("div")
        todoItem = document.createElement("div")
        radio = document.createElement("input")
        item = document.createElement("p")

        card.setAttribute("class", "card")
        cardBody.setAttribute("class", "card-body")
        todoItem.setAttribute("class", "todo-item")
        radio.setAttribute("type", "radio")
        item.setAttribute("class", "item")

        item.innerHTML = `${task.value}`

        todoItem.appendChild(radio)
        todoItem.appendChild(item)
        cardBody.appendChild(todoItem)
        card.appendChild(cardBody)
        todos.appendChild(card)
      }
      task.value = ""
    }
});