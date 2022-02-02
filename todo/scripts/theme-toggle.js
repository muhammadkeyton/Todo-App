(function() {
    const switchTheme = (function(event) {
        const displayNoneCSS = "display-none";
        let isDarkTheme = false;
    
        return function() {
            if(isDarkTheme) {
                document.documentElement.setAttribute('data-theme', 'light');
                
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
            document.querySelector("#light-theme").className = isDarkTheme ? displayNoneCSS : "";
            document.querySelector("#dark-theme").className = isDarkTheme ? "" : displayNoneCSS; 
            isDarkTheme = !isDarkTheme;
        }
    
    })();
    
    document.querySelector(".theme-button").addEventListener('click', switchTheme, false);
})();

