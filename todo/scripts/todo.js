const task = document.querySelector("input#input")

task.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      console.log(task.value)
    }
});