abstract class Visit {
    visit(r: Receiver) {
    }
}

abstract class Receiver {
    accept(visit: Visit) {
    }
}

// 被访问者
class Receiver1 extends Receiver {

    sayHello() {
        console.log("hello world")
    }

    sayDog() {
        console.log("hello wqx")
    }

    accept(visit: Visit) {
        visit.visit(this)
    }
}

// 具体访问者
class Visit1 extends Visit {

    visit(r: Receiver1) {
        // 访问 被访问者的 sayHello() 方法
        r.sayHello()
    }

}

class Visit2 extends Visit {

    visit(r: Receiver1) {
        // 访问 被访问者的 sayHello() 方法
        r.sayDog()
    }

}


let visitor1 = new Visit1()
let visitor2 = new Visit2()
let receiver: Receiver1 = new Receiver1()

// visitor visit receiver
// 根据 访问者和被访问者的不同，可以触发不同的操作
visitor1.visit(receiver)
visitor2.visit(receiver)
