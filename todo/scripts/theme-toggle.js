(function() {
    const switchTheme = (function(event) {
        const displayNoneCSS = "display-none";
        let isDarkTheme = false;
    
        return function() {
            if(isDarkTheme) {
                document.documentElement.setAttribute('data-theme', 'light');

                //changing the background image depending on the current theme
                document.querySelector(".top-section").classList.remove("top-section-dark-theme");
                
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');

                //changing the background image depending on the current theme
                document.querySelector(".top-section").classList.add("top-section-dark-theme");
            }
            document.querySelector("#light-theme").className = isDarkTheme ? displayNoneCSS : "";
            document.querySelector("#dark-theme").className = isDarkTheme ? "" : displayNoneCSS; 
            isDarkTheme = !isDarkTheme;
        }
    
    })();
    
    document.querySelector(".theme-button").addEventListener('click', switchTheme, false);
})();

