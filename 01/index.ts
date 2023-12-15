/**
 * 语法规则：
 *   prog: ( functionDecl | functionCall )*
 *   functionDecl: "function" Indetifier "("  ")" functionBody
 *   functionBody: "{" functionCal* "}"
 *   functionCall: Indentifier "(" parameterLists? ")"
 *  parameterLists: StringLiteral ( "," StringLiteral )*
 *
 */

/**
 * demo：
 *  function sayHello(){
 *      println("hello world");
 *  }
 *  sayHell();
 *
 */


/**
 * 知识点：
 *  1. 递归下降分析
 *  2. 引用消解
 *  3. 遍历AST
 */

// Token的类型
enum TokenKind {
    Keyword,
    Identifier,
    StringLiteral,
    Seperator,
    Operator,
    EOF,  // 表示程序的末尾
}

interface Token {
    kind: TokenKind,
    text: string
}

// 当前程序是由一系列Token组成的数组
let tokenArray: Token[] = [
    {kind: TokenKind.Keyword, text: 'function'},
    {kind: TokenKind.Identifier, text: 'sayHello'},
    {kind: TokenKind.Seperator, text: '('},
    {kind: TokenKind.Seperator, text: ')'},
    {kind: TokenKind.Seperator, text: '{'},
    {kind: TokenKind.Identifier, text: 'println'},
    {kind: TokenKind.Seperator, text: '('},
    {kind: TokenKind.StringLiteral, text: 'Hello World!'},
    {kind: TokenKind.Seperator, text: ')'},
    {kind: TokenKind.Seperator, text: ';'},
    {kind: TokenKind.Seperator, text: '}'},
    {kind: TokenKind.Identifier, text: 'sayHello'},
    {kind: TokenKind.Seperator, text: '('},
    {kind: TokenKind.Seperator, text: ')'},
    {kind: TokenKind.Seperator, text: ';'},
    {kind: TokenKind.EOF, text: ''}
]

const EOFToken: Token = {kind: TokenKind.EOF, text: ''}


/**
 * 词法分析器：用于语法分析器获取Token
 */
class Tokenizer {
    private tokens: Token[];
    private pos: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    //  返回下一个token
    next(): Token {
        // 说明到达了程序的末尾
        if (this.pos > this.tokens.length) {
            return EOFToken
        } else {
            return this.tokens[this.pos++]
        }
    }

    // 获取当前解析到token的位置
    position(): number {
        return this.pos;
    }

    // 返回到某个token的位置
    back(newPos: number): void {
        this.pos = newPos;
    }

}


// =======语法分析===========


/**
 * 抽象类，表示AST树的Node节点
 */

abstract class AstNode {
    // 打印对象信息
    public abstract dump(prefix: string): void;
}

/*
* 语句：包含函数声明和函数调用
* */

abstract class Statement extends AstNode {
    // is 关键字经常用来封装"类型判断函数"，
    // 通过和函数返回值的比较，从而缩小参数的类型范围，
    // 所以类型谓词 is 也是一种类型保护。
    // 返回值是 Statement 类型
    static isStatementNode(node: any): node is Statement {
        if (!node) {
            return false;
        } else {
            return true;
        }
    }
}

/*
* 程序节点，是AST根节点
* */
class ProgramNode extends AstNode {
    stmts: Statement[];


    constructor(stmts: Statement[]) {
        super();
        this.stmts = stmts;
    }

    dump(prefix: string): void {
        console.log(prefix + "Program")
        this.stmts.forEach(x => x.dump(prefix + "\t"));
    }

}

/*
* 函数声明节点
* */


class FunctionDecl extends Statement {
    name: string; // 函数名称
    body: FunctionBody; // 函数体


    constructor(name: string, body: FunctionBody) {
        super();
        this.name = name;
        this.body = body;
    }

    dump(prefix: string): void {
        console.log(prefix + "FunctionDecl " + this.name);
        this.body.dump(prefix + "\t");
    }

}

/*
* 函数体节点
* */

class FunctionBody extends AstNode {
    stmts: FunctionCall[];


    constructor(stmts: FunctionCall[]) {
        super();
        this.stmts = stmts;
    }

    static isFunctionBodyNode(node: any): node is FunctionBody {
        if (!node) {
            return false
        }
        return Object.getPrototypeOf(node) == FunctionBody.prototype
    }

    dump(prefix: string): void {
        console.log(prefix + "FunctionBody");
        this.stmts.forEach(x => x.dump(prefix + "\t"));
    }

}

/*
* 函数调用
* */

class FunctionCall extends Statement {
    name: string;
    parameters: string[];
    // 指向函数声明
    definition: FunctionDecl | null = null;


    constructor(name: string, parameters: string[]) {
        super();
        this.name = name;
        this.parameters = parameters;
    }

    static isFunctionCallNode(node: any): node is FunctionCall {
        if (!node) return false;
        return Object.getPrototypeOf(node) == FunctionCall.prototype;
    }

    dump(prefix: string): void {
        console.log(prefix + "FunctionCall " + this.name + (this.definition != null ?
            ", resolved" : ", not resolved"));
        this.parameters.forEach(x => console.log(prefix + "\t" + "Parameter: " + x));
    }

}

/*
* 解析器
* */

class Parser {
    tokenizer: Tokenizer;

    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
    }

    parseProgram(): ProgramNode {
        let stmts: Statement[] = [];
        let stmt: Statement | null | void = null;
        while (true) {
            // 尝试解析函数声明
            stmt = this.parseFunctionDecl();
            if (Statement.isStatementNode(stmt)) {
                stmts.push(stmt);
                continue;
            }
            // 尝试解析函数调用
            stmt = this.parseFunctionCall();
            if (Statement.isStatementNode(stmt)) {
                stmts.push(stmt);
                continue;
            }
            // 结束
            if (stmt == null) {
                break;
            }
        }
        return new ProgramNode(stmts)
    }

    /*
    * 解析函数声明
    * */
    parseFunctionDecl(): FunctionDecl | null | void {
        let oldPos: number = this.tokenizer.position()
        let t: Token = this.tokenizer.next()
        // 以function开头
        if (t.kind == TokenKind.Keyword && t.text == "function") {
            t = this.tokenizer.next()
            if (t.kind == TokenKind.Identifier) {
                let t1 = this.tokenizer.next()
                if (t1.text == "(") {
                    let t2 = this.tokenizer.next()
                    if (t2.text == ")") {
                        // parseFunctionBody
                        let functionBody = this.parseFunctionBody()
                        // 返回函数声明对象
                        if (FunctionBody.isFunctionBodyNode(functionBody)) {
                            return new FunctionDecl(t.text, functionBody)
                        }
                    } else {
                        console.log("Expecting ')' in FunctionDecl, while we got a " + t.text);
                        return;
                    }
                }
            }

        }

        // 解析不成功,回溯，返回null
        this.tokenizer.back(oldPos)
        return null
    }

    /*
    * 解析函数体
    * */
    parseFunctionBody(): FunctionBody | null | void {
        let oldPos: number = this.tokenizer.position();
        let stmts: FunctionCall[] = [];
        let t: Token = this.tokenizer.next();
        if (t.text == "{") {
            let functionCall = this.parseFunctionCall()
            //  解析函数体
            while (FunctionCall.isFunctionCallNode(functionCall)) {
                stmts.push(functionCall)
                functionCall = this.parseFunctionCall()
            }
            t = this.tokenizer.next()
            if (t.text == "}") {
                return new FunctionBody(stmts)
            } else {
                console.log("Expecting '}' in FunctionBody, while we got a " + t.text);
                return;
            }
        } else {
            console.log("Expecting '{' in FunctionBody, while we got a " + t.text);
        }

        // 同样，解析不成功，就回溯，返回null
        this.tokenizer.back(oldPos)
        return null

    }

    /*
    * 解析函数调用
    * */
    parseFunctionCall(): FunctionCall | null | void {
        let oldPos: number = this.tokenizer.position();
        let params: string[] = [];
        let t: Token = this.tokenizer.next();
        if (t.kind == TokenKind.Identifier) {
            let t1: Token = this.tokenizer.next()
            if (t1.text == "(") {
                let t2: Token = this.tokenizer.next();
                while (t2.text != ")") {
                    if (t2.kind == TokenKind.StringLiteral) {
                        params.push(t2.text);
                    } else {
                        console.log("Expecting parameter in FunctionCall, while we got a " + t2.text);
                        return;  //出错时，就不在错误处回溯了。
                    }
                    t2 = this.tokenizer.next();
                    if (t2.text != ")") {
                        if (t2.text == ",") {
                            t2 = this.tokenizer.next();
                        } else {
                            console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
                            return;
                        }
                    }
                }
                //消化掉一个分号：;
                t2 = this.tokenizer.next();
                if (t2.text == ";") {
                    return new FunctionCall(t.text, params);
                } else {
                    console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
                    return;
                }
            }
        }

        //如果解析不成功，回溯，返回null。
        this.tokenizer.back(oldPos)
        return null


    }

}


//============语义分析===========


/*
* 对AST进行遍历
* */

abstract class AstVisitor {

    visitProgramNode(programNode: ProgramNode): any {
        let retVal: any;
        for (let x of programNode.stmts) {
            if (typeof (x as FunctionDecl).body === 'object') {
                retVal = this.visitFunctionDecl(x as FunctionDecl)
            } else {
                retVal = this.visitFunctionCall(x as FunctionCall)
            }
        }
        return retVal
    }

    visitFunctionDecl(functionDecl: FunctionDecl): any {
        return this.visitFunctionBody(functionDecl.body)
    }

    visitFunctionBody(functionBody: FunctionBody): any {
        let retVal: any;
        for (let x of functionBody.stmts) {
            retVal = this.visitFunctionCall(x)
        }
        return retVal;
    }

    visitFunctionCall(functionCall: FunctionCall): any {
        return undefined
    }

}

// 对函数调用做引用消解
class RefResolver extends AstVisitor {
    programNode: ProgramNode | null = null;

    visitProgramNode(programNode: ProgramNode): any {
        this.programNode = programNode
        for (let x of programNode.stmts) {
            let functionCall = x as FunctionCall
            if (typeof functionCall.parameters === 'object') {
                this.resolveFunctionCall(programNode, functionCall)
            } else {
                this.visitFunctionDecl(x as FunctionDecl)
            }
        }
    }

    visitFunctionBody(functionBody: FunctionBody): any {
        if (this.programNode != null) {
            for (let x of functionBody.stmts) {
                return this.resolveFunctionCall(this.programNode, x)
            }
        }

    }

    // 函数引用消解
    private resolveFunctionCall(programNode: ProgramNode, functionCall: FunctionCall) {
        let functionDecl = this.findFunctionDecl(programNode, functionCall.name)
        //  找到了函数申明
        if (functionDecl != null) {
            functionCall.definition = functionDecl
        } else {
            // 如果没有找到用户申明的函数，则可能是系统函数
            if (functionCall.name != "println") {
                console.log("Error: cannot find definition of function " + functionCall.name);
            }
        }
    }

    // 查找函数的声明
    private findFunctionDecl(programNode: ProgramNode, name: string): FunctionDecl | null {

        for (let x of programNode.stmts) {
            let functionDecl = x as FunctionDecl
            if (typeof functionDecl.body === 'object' && functionDecl.name == name) {
                return functionDecl;
            }
        }
        return null;

    }

}

//============解释器===========

/*
* 遍历AST执行函数调用
* */

class Intepretor extends AstVisitor {

    visitProgramNode(programNode: ProgramNode): any {
        let retVal: any;
        for (let x of programNode.stmts) {
            let functionCall = x as FunctionCall;
            if (typeof functionCall.parameters === 'object') {
                retVal = this.runFunction(functionCall)
            }
        }
        return retVal
    }

    visitFunctionBody(functionBody: FunctionBody): any {
        let retVal: any
        for (let x of functionBody.stmts) {
            retVal = this.runFunction(x)
        }
        return retVal
    }

    private runFunction(functionCall: FunctionCall) {
        // 执行println函数
        if (functionCall.name == "println") {
            if (functionCall.parameters.length) {
                console.log(functionCall.parameters[0])
            } else {
                console.log()
            }
            return 0
        } else {
            //     找到函数定义，继续遍历函数体
            if (functionCall.definition != null) {
                this.visitFunctionBody(functionCall.definition.body)
            }
        }
    }


}

/*
* 主程序：编译并运行
* */

function compileAndRun() {

    // 词法分析
    let tokenizer: Tokenizer = new Tokenizer(tokenArray)

    for (let token of tokenArray) {
        console.log(token)
    }

    // 语法分析
    let program: ProgramNode = new Parser(tokenizer).parseProgram()
    console.log("\n语法分析后的AST：")
    program.dump("")

    // 语义分析
    new RefResolver().visitProgramNode(program)
    console.log("\n语义分析后的AST，注意自定义函数的调用已被消解:");
    program.dump("");

    // 运行程序
    console.log("当前运行的程序")

    let retVal = new Intepretor().visitProgramNode(program)
    console.log("程序返回值：" + retVal)

}

compileAndRun()


