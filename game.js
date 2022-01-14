kaboom({
    global: true,
    fullscreen: true,
    scale: 1.5,
    debug: true,
    clearColor: [0, 0, 0, 1],
})

const MOVE_SPEED = 120
const JUMP_FORCE = 360
const BIG_JUMP_FORCE = 450
const FALL_DEATH = 400
let isJumping = true
let CURRENT_JUMP_FORCE = JUMP_FORCE

loadRoot('https://i.imgur.com/')
loadSprite('coin', '7F4dlMY.png')
loadSprite('evil-shroom', 'TJu2h1F.png')
loadSprite('brick', 'nqLVXt8.png')
loadSprite('block', 'nBtvkbu.png')
loadSprite('mario', 'zGzSOxG.png')
loadSprite('mushroom', 'ny9cv5R.png')
loadSprite('surprise', 'TkhIdT1.png')
loadSprite('unboxed', '3ugBbYy.png')
loadSprite('pipe-top-left', 'DV3yRQW.png')
loadSprite('pipe-top-right', 'V8hpKI1.png')
loadSprite('pipe-bottom-left', 'KnKlSpJ.png')
loadSprite('pipe-bottom-right', 'eh9lLSH.png')

loadSprite('blue-block', 'A2bCj2X.png')
loadSprite('blue-brick', 'FLEQhqH.png')
loadSprite('blue-steel', 'Y80LqW2.png')
loadSprite('blue-evil-shroom', 'R9kOfSE.png')
loadSprite('blue-surprise', 'T7NEmGx.png')

scene("game", ({level, score }) => {
    layers(['bg', 'obj', 'ui'], 'obj')

    const maps = [
        [
        '                                    ',
        '                                    ',
        '                                    ',
        '                                    ',
        '     %    =*=%=                     ',
        '                                    ',
        '                          -+        ',
        '                  ^   ^   ()        ',
        '=============================  =====',
        ],
        [
        '£                                  z     £',
        '£                          xxxxxxxxx     £',
        '£                                        £',
        '£                                        £',
        '£         @@¬@@@                         £',
        '£                          x             £',
        '£                        x x x  x      -+£',
        '£          z      z     xx x x  x      ()£',
        '!!!!!!!!!!!!!!!!!!!!!  !!!!!!!  !!!!!!!!!!',
        ],
    ]

    const levelCfg = {
        width: 20,
        height: 20,
        '=': [sprite('block'), solid()],
        '$': [sprite('coin'), 'coin'],
        '%': [sprite('surprise'), solid(), 'coin-surprise'],
        '*': [sprite('surprise'), solid(), 'mushroom-surprise'],
        '}': [sprite('unboxed'), solid()],
        '(': [sprite('pipe-bottom-left'), solid(), scale(0.5)],
        ')': [sprite('pipe-bottom-right'), solid(), scale(0.5)],
        '-': [sprite('pipe-top-left'), solid(), scale(0.5), 'pipe'],
        '+': [sprite('pipe-top-right'), solid(), scale(0.5), 'pipe'],
        '^': [sprite('evil-shroom'), solid(), 'dangerous', body()],
        '#': [sprite('mushroom'), solid(), 'mushroom', body()],
        '!': [sprite('blue-block'), solid(), scale(0.5)],
        '£': [sprite('blue-brick'), solid(), scale(0.5)],
        'z': [sprite('blue-evil-shroom'), solid(), scale(0.5), 'dangerous', body()],
        '@': [sprite('blue-surprise'), solid(), scale(0.5), 'coin-surprise'],
        '¬': [sprite('blue-surprise'), solid(), scale(0.5), 'mushroom-surprise'],
        'x': [sprite('blue-steel'), solid(), scale(0.5)],
    }

    const gameLevel = addLevel(maps[level], levelCfg)

    add([text('Score: '), pos(100, 6)])

    const scoreLabel = add([
        text(score),
        pos(152, 6),
        layer('ui'),
        {
            value: score,
        }
    ])

    add([text('Level ' + parseInt(level + 1)), pos(30, 6)])

    function big() {
        let timer = 0
        let isBig = false
        return {
            update() {
                if (isBig) {
                    CURRENT_JUMP_FORCE = BIG_JUMP_FORCE
                    timer -= dt()
                    if (timer <= 0) {
                        this.smallify()
                    }
                }
            },
            isBig() {
                return isBig
            },
            smallify() {
                CURRENT_JUMP_FORCE = JUMP_FORCE
                this.scale = vec2(1)
                timer = 0
                isBig = false
            },
            biggify(time) {
                this.scale = vec2(2)
                timer = time
                isBig = true
            }
        }
    }

    const player = add([
        sprite('mario'), solid(),
        pos(30, 0),
        body(),
        big(),
        origin('bot')
    ])

    action('mushroom', (m) => {
        m.move(30, 0)
    })

    player.on("headbump", (obj) => {
        if (obj.is('coin-surprise')) {
            gameLevel.spawn('$', obj.gridPos.sub(0, 1))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0, 0))
        }
        if (obj.is('mushroom-surprise')) {
            gameLevel.spawn('#', obj.gridPos.sub(0, 1))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0, 0))
        }
    })

    player.collides('mushroom', (m) => {
        destroy(m)
        player.biggify(6)
    })

    player.collides('coin', (c) => {
        destroy(c)
        scoreLabel.value++
        scoreLabel.text = scoreLabel.value
    })

    const ENEMY_SPEED = 20

    action('dangerous', (d) => {
        d.move(-ENEMY_SPEED, 0)
    })

    player.collides('dangerous', (d) => {
        if (isJumping) {
            scoreLabel.value = scoreLabel.value + 10
            scoreLabel.text = scoreLabel.value
            destroy(d)            
        } else {
            go('lose', { score: scoreLabel.value })
        }
    })

    player.action(() => {
        camPos(player.pos)
        if(player.pos.y >= FALL_DEATH){
            go('lose', {score: scoreLabel.value})
        }
    })

    player.collides('pipe', () => {
        keyPress('down', () => {
            go('game', {
                level: (level + 1) % maps.length,
                score: scoreLabel.value                
            })
            if(player.isBig){
                player.smallify()
            }            
        })
    })

    keyDown('left', () => {
        player.move(-MOVE_SPEED, 0)
    })

    keyDown('right', () => {
        player.move(MOVE_SPEED, 0)
    })

    player.action(() => {
        if (player.grounded()) {
            isJumping = false
        }
    })

    keyPress('space', () => {
        if (player.grounded()) {
            isJumping = true
            player.jump(CURRENT_JUMP_FORCE)
        }
    })

})

scene('lose', ({ score }) => {
    add([text('Score: ' + score, 32), origin('center'), pos(width() / 2, height() / 2)])
})

start("game", {level: 0, score: 0 })