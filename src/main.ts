import { Xterm } from "./xterm";
import { Terminal, WebTTY, protocols } from "./webtty";
import { ConnectionFactory } from "./websocket";

/**
 * The variable that user should declare in global scope
 */
declare var shellPrez: {
    // websocket url of the Gotty server
    gottyWsUrl: string

    // steps for the user's presentation
    steps: {
        // slide title
        title: string

        // slide command
        command?: string

        // slide text about the command
        conclusion?: string
    }[]
}

interface EventTarget {
    closest(node: Node): boolean
}

async function wait(duration) {
    return new Promise(resolve => setTimeout(() => resolve(), duration))
}

const e = (id) => {
    return document.getElementById(id)
}

const input = (id) => {
    return document.getElementById(id) as HTMLInputElement
}

window.addEventListener('load', () => {
    console.log(`Starting ShellPrez, connecting to ${shellPrez.gottyWsUrl}`)

    const elem = e('terminal')
    if (!elem) {
        console.error(`you forgot to have a '#terminal' div element in your page !`)
        return
    }

    var term = new Xterm(elem)

    const args = window.location.search
    const factory = new ConnectionFactory(shellPrez.gottyWsUrl, protocols)
    const wt = new WebTTY(term as Terminal, factory, args, '')

    const closer = wt.open()
    window.addEventListener("unload", () => {
        closer()
        term.close()
    })

    let demoCurrentStep = 0

    const next = (giveFocus) => {
        if (demoCurrentStep < shellPrez.steps.length - 1)
            demoCurrentStep++
        displayStep()
        giveFocus && term.term.focus()
    }

    const previous = (giveFocus) => {
        if (demoCurrentStep > 0)
            demoCurrentStep--
        displayStep()
        giveFocus && term.term.focus()
    }

    const runCurrentCommand = (giveFocus, appendCR) => {
        const payload = `1${shellPrez.steps[demoCurrentStep].command}` + (appendCR ? '\r' : '')
        wt.connection.send(payload)
        giveFocus && term.term.focus()
    }

    input('connectUrl').value = localStorage.getItem('connectUrl') || ''

    e('previous').addEventListener('click', () => previous(true))
    e('next').addEventListener('click', () => next(true))
    e('command').addEventListener('click', () => runCurrentCommand(true, false))
    e('runCommand').addEventListener('click', () => runCurrentCommand(true, true))

    window.addEventListener('keyup', event => {
        if (!(event.target as any).closest('#terminal')) {
            switch (event.key) {
                case 'n':
                    next(false)
                    break
                case 'p':
                    previous(false)
                    break
                case 'r':
                    runCurrentCommand(false, true)
                    break
            }
        }
    })

    const displayStep = async () => {
        const step = shellPrez.steps[demoCurrentStep]

        e('title').innerHTML = step.title || ''
        e('command').innerHTML = step.command || ''
        e('conclusion').innerHTML = step.conclusion || ''
    }

    displayStep()
})