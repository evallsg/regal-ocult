 // Definim l'arbre de nodes del text.
    // Un node pot ser un simple text (string) o un objecte claudàtor (amb id, answer, i contingut niat)
    const puzzleTree = [
        "Hi ha regals que s'",
        {
            id: "p1", answer: "emboliquen", hintState: "none",
            content: [
                "Quan dues ",
                {
                    id: "p3", answer: "persones", hintState: "none",
                    content: ["Animals humans"]
                },
                "  es morregen"
            ]
        },
        ". D'altres es ",
        {
            id: "p2", answer: "for", hintState: "none",
            content: ["Indiques duració, propòsit o benefici en anglès"]
        },
        "gen. El teu encara no té ",
        {
            id: "p4", answer: "forma", hintState: "none",
            content: ["Ho estàs quan corres una mitja marató i ho és el quadrat"]
        },
        ", però a",
        {
            id: "p5", answer: "via", hintState: "none",
            content: [ "Pot ser Augusta, ferrata o en pots anar fent" ]
        },
        "t el convertiràs en un ",
        {
            id: "p6", answer: "record", hintState: "none",
            content: [
                {
                    id: "p7", answer: "Mar", hintState: "none",
                    content: [ "srolf ed tnujnoC" ]
                },
                "ca que pot ser Guiness o personal"
            ]
        },
        " que podràs ",
        {
            id: "p8", answer: "porta", hintState: "none",
            content: [
                "La pots obrir o la ",
                {
                    id: "p9", answer: "Mireia",  hintState: "none",
                    content: [ "Mare de la Clara"]
                },
                " i l’Eli poden preguntar si t’agradaria ser-ho"
            ]
        },
        "r sempre amb ",
        {
            id: "p10", answer: "tu", hintState: "none",
            content: [ "xifus tseuqa bma sbrev sle abaca anoriG ed tneg aL" ]
        },
        ". I no ho faràs ",
        {
            id: "p11", answer: "sola", hintState: "none",
            content: [
                "La nota ",
                {
                    id: "p12", answer: "musical", hintState: "none",
                    content: [ "El fantasma de l’òpera, Mamma Mia o Mar i Cel" ]
                },
                " que no va acompanyada es fusiona amb la següent"
            ]
        },
        ". - ",
        {
            id: "p13", answer: "SAGERAO", hintState: "none",
            content: [ "Exagerat en el nostre argot" ]
        }
    ];

    let selectedId = null;
    let totalBrackets = 0;
    let solvedBrackets = new Set();
    let currentScore = 100;
    let errorsCount = 0;
    let hintsCount = 0;
    let revealedCount = 0;

    function countTotalBrackets(nodes) {
        nodes.forEach(node => {
            if (typeof node === 'object') {
                totalBrackets++;
                if (node.content) countTotalBrackets(node.content);
            }
        });
    }

    function findBracketById(nodes, id) {
        for (let node of nodes) {
            if (typeof node === 'object') {
                if (node.id === id) return node;
                if (node.content) {
                    const found = findBracketById(node.content, id);
                    if (found) return found;
                }
            }
        }
        return null;
    }

    function findBracketByAnswer(nodes, answer) {
        for (let node of nodes) {
            if (typeof node === 'object') {
                if (node.answer.toUpperCase() === answer.toUpperCase()) {
                    for(let i = 0; i < node.content.length; i++) {
                        const n = node.content[i];
                        if ( typeof n === 'object' && !solvedBrackets.has(n.id) ) {
                            return;
                        }
                    }
                    return node;
                }
                if (node.content) {
                    const found = findBracketByAnswer(node.content, answer);
                    if (found) return found;
                }
            }
        }
        return null;
    }


    function renderTree(nodes) {
        let html = "";
        nodes.forEach(node => {
            if (typeof node === 'string') {
                html += node;
            } else if (typeof node === 'object') {
                if (solvedBrackets.has(node.id)) {
                    html += node.answer;
                } else {
                    const isSelected = selectedId === node.id ? ' selected' : '';
                    // Si té la primera lletra revelada, la mostrem al costat del claudàtor
                    const letterHint = node.hintState !== 'none' ? `<b style="color:#c92a2a; margin-right:2px;">(${node.answer[0]}...)</b>` : '';
                    let childrenSolved = true;
                    for(let i = 0; i < node.content.length; i++) {
                        const n = node.content[i];
                        if ( typeof n === 'object' && !solvedBrackets.has(n.id) ) {
                            childrenSolved = false;
                            break;
                        }
                    }
                    html += letterHint;
                    html += `<span class="${childrenSolved? "bracket" : ""}${isSelected}" data-id="${node.id}" onclick="handleBracketClick(event, '${node.id}')">[`;
                    html += renderTree(node.content);
                    html += ']</span>';
                }
            }
        });
        return html;
    }

    function updateDisplay() {
        const container = document.getElementById('text-container');
        container.innerHTML = renderTree(puzzleTree);
        document.getElementById('solved-count').innerText = solvedBrackets.size;
        document.getElementById('hints-count').innerText = hintsCount;
        document.getElementById('errors-count').innerText = errorsCount;
        document.getElementById('revealed-count').innerText = revealedCount;

        if( solvedBrackets.size === totalBrackets ) {

            const main = document.getElementsByClass('main-card');
            main[0].classList.add("success");
        }

    }

    // Controla la lògica en prémer un claudàtor
    function handleBracketClick(event, id) {
        event.stopPropagation();
        
        // Si el tornem a clicar estant ja seleccionat, obrim el popup de pistes de l'original
        // if (selectedId === id) {
            openHintModal(id);
            return;
        // }

        selectedId = id;
        updateDisplay();

        const input = document.getElementById('guess-input');
        input.disabled = false;
        input.placeholder = `RESPOSTA PEL CLAUDÀTOR SELECCIONAT...`;
        input.value = "";
        input.focus();
    }

    // Obre la finestra de diàleg contextual adaptant-se a l'estat de la pista
    function openHintModal(id) {
        const bracket = findBracketById(puzzleTree, id);
        if (!bracket) return;

        const contentEl = document.getElementById('modal-content');
        const confirmBtn = document.getElementById('btn-modal-confirm');
        
        // Obtenim el text net de la definició interior de forma recursiva per al missatge
        const textDefinicio = getTextFromContent(bracket.content);

        if (bracket.hintState === 'none') {
            // Nivell 1: Demanar primera lletra
            contentEl.innerHTML = `
                Vols revelar la primera lletra de <strong>"${textDefinicio}"</strong>?
                <div class="modal-warning">🚨 Això penalitzarà la teva puntuació (-5 punts).</div>
            `;
            confirmBtn.onclick = () => revealFirstLetter(id);
        } else if (bracket.hintState === 'letter') {
            // Nivell 2: Ja té lletra, demanar paraula completa
            contentEl.innerHTML = `
                Vols revelar completament la paraula secreta per a <strong>"${textDefinicio}"</strong>?
                <div class="modal-warning">🚨 Això resoldrà el claudàtor però restarà molts punts (-20 punts).</div>
            `;
            confirmBtn.onclick = () => revealFullWord(id);
        }

        document.getElementById('modal-hint').classList.add('active');
    }

    function closeModal() {
        document.getElementById('modal-hint').classList.remove('active');
    }

    /* --- Funcions de la modal de Tutorial --- */
    function openTutorialModal() {
        document.getElementById('modal-tutorial').classList.add('active');
    }

    function closeTutorialModal() {
        document.getElementById('modal-tutorial').classList.remove('active');
    }

    // Acció: Revelar només la primera lletra
    function revealFirstLetter(id) {
        const bracket = findBracketById(puzzleTree, id);
        if (bracket) {
            bracket.hintState = 'letter';
            currentScore -= 5;
            hintsCount++;
            updateDisplay();
        }
        closeModal();
    }

    // Acció: Revelar tota la paraula (Resta punts i auto-resol)
    function revealFullWord(id) {
        const bracket = findBracketById(puzzleTree, id);
        if (bracket) {
            bracket.hintState = 'full';
            solvedBrackets.add(id);
            currentScore -= 20;
            selectedId = null;
            revealedCount++;
            // Reajustar input inferior
            const input = document.getElementById('guess-input');
            input.value = "";
            // input.disabled = true;
            input.placeholder = "ESCRIU UNA RESPOSTA...";
            
            updateDisplay();
        }
        closeModal();
    }

    // Funció auxiliar per extreure les cadenes de text de dins d'un claudàtor per posar al popup
    function getTextFromContent(nodes) {
        let text = "";
        nodes.forEach(node => {
            if (typeof node === 'string') text += node;
            else if (typeof node === 'object') text += `[${getTextFromContent(node.content)}]`;
        });
        return text;
    }

    function checkAnswer() {
        // if (!selectedId) return;

        const input = document.getElementById('guess-input');
        const userGuess = input.value.trim().toUpperCase();
        const activeBracket = findBracketByAnswer(puzzleTree, userGuess); //findBracketById(puzzleTree, selectedId);
        
        if (activeBracket){// && userGuess.toUpperCase() === activeBracket.answer.toUpperCase()) {
            solvedBrackets.add(activeBracket.id);
            selectedId = null;
            currentScore += 10; // Encertar dona punts
            
            input.value = "";
            // input.disabled = true;
            input.placeholder = "ESCRIU UNA RESPOSTA...";
            
            if (solvedBrackets.size === totalBrackets) {
                alert("🎉 Enhorabona! Has completat l'enigma dels claudàtors!");

            }
        } else {
            errorsCount++;
            input.style.backgroundColor = '#f8d7da';
            setTimeout(() => { input.style.backgroundColor = 'white'; }, 250);
            input.value = "";
            input.focus();
        }
        updateDisplay();

    }

    // Inicialització global
    countTotalBrackets(puzzleTree);
    document.getElementById('total-count').innerText = totalBrackets;
    updateDisplay();

    document.getElementById('guess-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkAnswer();
    });