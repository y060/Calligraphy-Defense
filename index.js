
import Fonts from "./assets/type.json" assert { type: "json" }

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    width: window.innerWidth > 400 ? 400 : window.innerWidth,
    height: window.innerHeight,
    // pixelArt: true,
    backgroundColor: "#add8e6",
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 150 },
            // debug: true
        }
    }
}

const game = new Phaser.Game(config)


function preload() {
    // console.log("preload")

    this.load.spritesheet("attack", "./assets/main_character/fire.png", { frameWidth: 16, frameHeight: 16 })    // https://www.spriters-resource.com/pc_computer/duckgame/sheet/116747/
    this.load.spritesheet("dragon", "./assets/main_character/dragon.png", { frameWidth: 512 , frameHeight: 512})

    this.load.spritesheet("f1_1", "./assets/fonts/spritesheet/1_1_1.png", { frameWidth: 250, frameHeight: 250 })    // 篆書
    this.load.spritesheet("f2_1", "./assets/fonts/spritesheet/2_1_1.png", { frameWidth: 250, frameHeight: 250 })    // 隸書
    this.load.spritesheet("f3_1", "./assets/fonts/spritesheet/3_1_1.png", { frameWidth: 250, frameHeight: 250 })    // 楷書
    this.fontType = ["f1_1", "f2_1", "f3_1"]
}


// 前置作業，變數設定
function initData() {
    this.gameWidth = this.game.config.width
    this.gameHeight = this.game.config.height

    this.cursors = this.input.keyboard.createCursorKeys()

    // this.usingMobile = window.matchMedia("(max-width: 767px)").matches

    // 龍
    this.moveVel = 300
    this.anims.create({
        key: "dragonMove",
        frames: this.anims.generateFrameNumbers("dragon", { start: 0, end: 4 }),
        frameRate: 6,
        repeat: -1
    })

    // 火焰攻擊
    this.fireGroup = this.add.group()
    this.anims.create({
        key: "fireAnimation",
        frames: this.anims.generateFrameNumbers("attack", { start: 0, end: 4 }),
        frameRate: 10,
        repeat: -1
    })
    this.lastFireTime = 0
    this.fireInterval = 200

    // 敵人
    this.enemyGroup = this.physics.add.group()
    this.randomFont = Math.floor(Math.random() * this.fontType.length)
    const type_n = this.fontType[this.randomFont][1]
    console.log(`保護字體：${Fonts[type_n].name}`)
    this.fontTypeText = this.add.text(20, 20, `保護字體：${Fonts[type_n].name}`, { fontFamily: "CubicFont", fontSize: "20px" })
    this.fontTypeText.setDepth(2)

    // 分數設定
    this.score = 0
    this.scoreText = this.add.text(20, 40, `分數：${this.score}`, { fontFamily: "CubicFont" })
    this.scoreText.setDepth(2)

    // 重新開始
    this.deadText = {
        "attacked1": ["你被敵對字體揍了一拳", "敵對字體踢到你了", "敵對字體把你吃了"],
        "attacked2": ["你沒躲過友軍的範圍技", "友軍沒看後面揮到你了", "友軍表示抱歉"],
        "wrongAttack": ["友軍對您露出微笑^^", "你打到友軍了= ="]
    }
    this.deadReason = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 10, "", { fontFamily: "CubicFont", fontSize: "20px"})
    this.deadReason.setAlpha(0)
        .setDepth(2)
        .setOrigin(0.5, 0.5)
    this.restartText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 10, "點擊以重新開始", { fontFamily: "CubicFont" })
    this.restartText.setAlpha(0)
        .setDepth(2)
        .setOrigin(0.5, 0.5)
    this.input.on('pointerdown', (pointer) => {
        if(!this.isGameRunnning){
            if(pointer.leftButtonDown()) {
            
                // 重置龍
                this.dragon.x = this.gameWidth / 2
                this.dragon.y = this.gameHeight / 5 * 4

                // 重置攻擊和敵人
                this.fireGroup.getChildren().map((item) => {
                    this.fireGroup.killAndHide(item)
                    item.body.destroy()
                })
                this.enemyGroup.getChildren().map((item) => {
                    this.enemyGroup.killAndHide(item)
                    item.body.destroy()
                })

                // 重置字體
                this.randomFont = Math.floor(Math.random() * this.fontType.length)
                const type_n = this.fontType[this.randomFont][1]
                console.log(`保護字體：${Fonts[type_n].name}`)
                this.fontTypeText.setText(`保護字體：${Fonts[type_n].name}`)
                
                // 重置設定
                this.score = 0
                this.scoreText.setText(`分數：${this.score}`)

                this.lastFireTime = 0
                this.fireInterval = 200
                this.initialDelay = 1000

                this.physics.resume()
                this.deadReason.setAlpha(0)
                this.restartText.setAlpha(0)
                this.isGameRunnning = true
            }
        }
        
    });

    this.isGameRunnning = true
}


function create() {
    // console.log("create")
    initData.call(this)

    this.dragon = this.physics.add.sprite(this.gameWidth/2, this.gameHeight/5*4, "dragonMove")
    this.dragon.play("dragonMove", true)
        .setScale(0.2)
        .setSize(512, 512)
        .setDepth(1)
    this.dragon.body.allowGravity = false

    initEnemy.call(this)
    initCollider.call(this)
}

function initEnemy() {
    this.initialDelay = 1000    // 初始間格時間

    const enemyTimer = this.time.addEvent({
        delay: this.initialDelay,
        loop: true,
        callback: () => {
            const x = Phaser.Math.Between(0, this.gameWidth - 250*0.3)

            // 創建敵人
            const randomFont = Math.floor(Math.random() * this.fontType.length)
            const randomNum = Math.floor(Math.random() * 16)
            const enemy = this.physics.add.sprite(x, -this.dragon.height, this.fontType[randomFont], randomNum)
            enemy.setScale(0.27)
                .setOrigin(0, 0)
                .setVelocityY(220)
                .setActive(true)
                .setDepth(0)
            enemy.canAttack = randomFont == this.randomFont? false : true

            this.enemyGroup.add(enemy)
            
            // 掉得越來越快
            this.initialDelay -= 5
            enemyTimer.delay = Math.max(this.initialDelay, 100)    // 最小間隔為100毫秒
            
        },
      })

}

function initCollider() {
    // 火焰 -> 敵人
    this.physics.add.overlap(this.fireGroup, this.enemyGroup, (fire, enemy) => {
        if (enemy.canAttack) {
            this.score += 50;
            this.scoreText.setText("分數：" + this.score);
            enemy.destroy();
        }else{
            this.physics.pause()
            this.isGameRunnning = false

            this.deadReason.setText( this.deadText.wrongAttack[ Math.floor(Math.random() * this.deadText.wrongAttack.length) ] )
            this.deadReason.setAlpha(1)
            this.restartText.setAlpha(1)
        }
        fire.destroy();
    });

    // 敵人 -> 龍
    this.physics.add.overlap(this.dragon, this.enemyGroup, (dragon, enemy) => {

        this.physics.pause()
        this.isGameRunnning = false

        if(enemy.canAttack){
            this.deadReason.setText( this.deadText.attacked1[ Math.floor(Math.random() * this.deadText.attacked1.length) ] )
        } else{
            this.deadReason.setText( this.deadText.attacked2[ Math.floor(Math.random() * this.deadText.attacked2.length) ] )
        }
        this.deadReason.setAlpha(1)
        this.restartText.setAlpha(1)
    });

}


function update() {
    console.log("update")

    if(this.cursors.left.isDown){
        this.dragon.body.setVelocityX(-this.moveVel)
    }
    if(this.cursors.right.isDown){
        this.dragon.body.setVelocityX(this.moveVel)
    }
    if(this.cursors.up.isDown){
        this.dragon.body.setVelocityY(-this.moveVel)
    }
    if(this.cursors.down.isDown){
        this.dragon.body.setVelocityY(this.moveVel)
    }
    if(this.cursors.left.isUp && this.cursors.right.isUp){
        this.dragon.body.setVelocityX(0)
    }
    if(this.cursors.up.isUp && this.cursors.down.isUp){
        this.dragon.body.setVelocityY(0)
    }

    if(this.isGameRunnning && this.cursors.space.isDown){
        const currentTime = this.time.now;
        if (currentTime - this.lastFireTime > this.fireInterval) {
            fireAttack.call(this);
            this.lastFireTime = currentTime;
        }
    }

    // 邊界檢查，確保龍不會移出畫面範圍
    const halfDragonWidth = this.dragon.displayWidth * 0.5;
    const halfDragonHeight = this.dragon.displayHeight * 0.5;

    this.dragon.x = Phaser.Math.Clamp(this.dragon.x, halfDragonWidth, this.gameWidth - halfDragonWidth);
    this.dragon.y = Phaser.Math.Clamp(this.dragon.y, halfDragonHeight, this.gameHeight - halfDragonHeight);

    // 邊界檢查，確保火焰不會射出畫面範圍之外
    this.fireGroup.getChildren().forEach(fire => {
        if (fire.y < 0 || fire.y > this.gameHeight) {
            fire.destroy()
        }
    })

    // 保護的敵人（？）過了之後加分
    this.enemyGroup.getChildren().forEach(enemy => {
        if (enemy.y > this.gameHeight + 20){
            enemy.canAttack? this.score -= 10 : this.score += 30
            this.scoreText.setText(`分數：${this.score}`)
            enemy.destroy()
        }
    })
    
}


function fireAttack() {
    const fire = this.physics.add.sprite(this.dragon.x, this.dragon.y, "fireAnimation")
    fire.play("fireAnimation", true)
        .setScale(3)
        .setSize(10, 14)
    fire.body.setVelocityY(-700)
    fire.body.allowGravity = false

    this.fireGroup.add(fire)
}