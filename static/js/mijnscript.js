// Variabelen declareren
const persoonsgegevens = document.getElementById('persoonsgegevens');
const accountgegevens = document.getElementById('accountgegevens');
const buttonNext = document.getElementById('next');
const buttonTerug = document.getElementById('back');
const form = document.getElementById('registratepage');


// Wanneer buttonNext wordt geklikt
buttonNext.addEventListener('click', function(e) {
    e.preventDefault;
    accountgegevens.style.display = 'block';
    persoonsgegevens.style.display = 'none';
    console.log(persoonsgegevens);
});

buttonTerug.addEventListener('click', function(e) {
    e.preventDefault;
    accountgegevens.style.display = 'none';
    persoonsgegevens.style.display = 'block';
    console.log(persoonsgegevens);
});