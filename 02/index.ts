/**
 * 词法分析，将语法升级为LL算法
 *
 * 当前词法规则：
 *   Identifier: [a-zA-Z_][a-zA-Z0-9_]*
 * */


/**
 * 字符串流操作
 */


const fs = require('fs')
// 处理命令行参数
import * as process from 'process'

class CharStream {
    data: string;
    pos: number = 0;
    line: number = 1;
    col: number = 0;


    constructor(data: string) {
        this.data = data;
    }

    // 预读下一个字符，但不移动指针
    peek(): string {
        return this.data.charAt(this.pos)
    }

    // 读取下一个字符，移动指针
    next(): string {
        let char = this.data.charAt(this.pos++)
        if (char == "\n") {
            this.line++
            this.col = 0
        } else {
            this.col++
        }
        return char
    }

    // 判断是否已经到了结尾
    eof(): boolean {
        return this.peek() == ''
    }

}


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

const EOFToken: Token = {kind: TokenKind.EOF, text: ''}


/**
 * 词法分析器：用于语法分析器获取Token
 */
class Tokenizer {
    private stream: CharStream;
    private nextToken: Token = {kind: TokenKind.EOF, text: ''}

    constructor(stream: CharStream) {
        this.stream = stream
    }

    //  返回当前Token，并移向下一个Token
    next(): Token {
        // 第一次读取，先解析一个Token
        if (this.nextToken.kind == TokenKind.EOF
            && !this.stream.eof()) {
            this.nextToken = this.getAToken()
        }
        let lastToken: Token = this.nextToken

        // 预读一个Token
        this.nextToken = this.getAToken()
        return lastToken
    }

    // 返回当前Token，但不移动当前位置
    peek(): Token {
        if (this.nextToken.kind == TokenKind.EOF
            && !this.stream.eof()) {
            this.nextToken = this.getAToken()
        }
        return this.nextToken;
    }

    // 从字符串流中返回一个新的Token
    private getAToken(): Token {
        // 跳过空白字符
        this.skipWhiteSpaces()
        // 读到程序末尾
        if (this.stream.eof()) {
            return EOFToken
        } else {
            // 预读一个符号
            let ch: string = this.stream.peek()
            // 标识符
            if (this.isLetter(ch) || this.isDigit(ch)) {
                return this.parseIdentifer()
            }
            // 字面量
            else if (ch == '"') {
                return this.parseStringLiteral()
            }
            // 分割符
            else if (ch == '(' || ch == ')' || ch == '{' || ch == '}' || ch == ';' || ch == ',') {
                this.stream.next()
                return {
                    kind: TokenKind.Seperator,
                    text: ch
                }
            } else if (ch == '/') {
                this.stream.next()
                let ch1: string = this.stream.peek()
                // 注释
                if (ch1 == '*') {
                    this.skipMultipleLineComment()
                    return this.getAToken()
                } else if (ch1 == '/') {
                    this.skipSingleLineComment()
                    return this.getAToken()
                } else if (ch1 == '=') {
                    this.stream.next()
                    return {kind: TokenKind.Operator, text: '/='}
                } else {
                    return {kind: TokenKind.Operator, text: '/'}
                }
            } else if (ch == '+') {
                this.stream.next()
                let ch1: string = this.stream.peek()
                if (ch1 == '+') {
                    this.stream.next();
                    return {kind: TokenKind.Operator, text: '++'};
                } else if (ch1 == '=') {
                    this.stream.next();
                    return {kind: TokenKind.Operator, text: '+='};
                } else {
                    return {
                        kind: TokenKind.Operator,
                        text: '+'
                    }
                }
            } else if (ch == '-') {
                this.stream.next()
                let ch1: string = this.stream.peek()
                if (ch1 == '-') {
                    this.stream.next()
                    return {
                        kind: TokenKind.Operator,
                        text: '--'
                    }
                } else if (ch1 == '=') {
                    this.stream.next()
                    return {
                        kind: TokenKind.Operator,
                        text: '-='
                    }
                } else {
                    return {
                        kind: TokenKind.Operator,
                        text: '-'
                    }
                }
            } else if (ch == '*') {
                this.stream.next()
                let ch1: string = this.stream.peek()
                if (ch1 == '*') {
                    this.stream.next()
                    return {
                        kind: TokenKind.Operator,
                        text: '**'
                    }
                } else if (ch1 == '=') {
                    this.stream.next()
                    return {
                        kind: TokenKind.Operator,
                        text: '*='
                    }
                } else {
                    return {
                        kind: TokenKind.Operator,
                        text: '*'
                    }
                }

            } else {
                // 去掉不能识别的字符
                console.log("Unrecognized pattern meeting ': " + ch + "', at" + this.stream.line + " col: " + this.stream.col);
                this.stream.next();
                return this.getAToken();
            }
        }

    }


    // 解析字符串字面量
    private parseStringLiteral(): Token {
        let token: Token = {
            kind: TokenKind.StringLiteral,
            text: ''
        }
        // 第一个字符已经被判断过了
        this.stream.next()
        while (!this.stream.eof() && this.stream.peek() != '"') {
            token.text += this.stream.next()
        }

        if (this.stream.peek() == '"') {
            this.stream.next()
        } else {
            console.log("Expecting an \" at line: " + this.stream.line + " col: " + this.stream.col);
        }
        return token

    }

    // 解析标识符，从中检索关键字
    parseIdentifer(): Token {
        let token: Token = {
            kind: TokenKind.Identifier,
            text: ""
        }

        // 第一个字符在调用者处已经判断
        token.text += this.stream.next()

        // 读入后续的字符
        while (!this.stream.eof() &&
        this.isLetterDigitOrUnderScore(this.stream.peek())) {
            token.text += this.stream.next()
        }

        // 识别关键字
        if (token.text == 'function') {
            token.kind = TokenKind.Keyword
        }
        return token
    }

    // 跳过单行注释
    private skipSingleLineComment() {
        // 第一个已经跳过
        this.stream.next()

        // 一直到回车或者eof
        while (this.stream.peek() != '\n' && !this.stream.eof()) {
            this.stream.next()
        }
    }

    // 跳过多行注释
    private skipMultipleLineComment() {
        // 跳过 *
        this.stream.next()
        if (!this.stream.eof()) {
            let ch1: string = this.stream.next()
            while (!this.stream.eof()) {
                let ch2: string = this.stream.next()
                if (ch1 == '*' && ch2 == '/') {
                    return
                }
                ch1 = ch2
            }
        }
        // 匹配不上，报错
        console.log("Failed to find matching */ for multiple line comments at ': "
            + this.stream.line + " col: " + this.stream.col)
    }


    // 跳过空字符
    private skipWhiteSpaces() {
        while (this.isWhiteSpace(this.stream.peek())) {
            this.stream.next()
        }
    }

    // 当前字符是否为字母、数字或下划线
    private isLetterDigitOrUnderScore(ch: string): boolean {
        return this.isLetter(ch) ||
            this.isDigit(ch) ||
            this.isUnderScore(ch)
    }

    // 是否为下划线符号
    private isUnderScore(ch: String): boolean {
        return ch == '_'
    }

    // 判断字符是否为空白字符
    private isWhiteSpace(ch: string): boolean {
        return ch == ' ' || ch == '\n' || ch == '\t'
    }

    // 判断字符是否为数字
    private isDigit(ch: string): boolean {
        return (ch > '0' && ch < '9')
    }

    // 判断字符是否为字母
    private isLetter(ch: string): boolean {
        return (ch >= 'A' && ch <= 'Z' || ch >= 'a' && ch <= 'z')
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
        let stmt: Statement | null = null;
        // 预读token
        let token: Token = this.tokenizer.peek()
        while (token != EOFToken) {
            if (token.kind == TokenKind.Keyword && token.text == 'function') {
                stmt = this.parseFunctionDecl()
            } else if (token.kind == TokenKind.Identifier) {
                stmt = this.parseFunctionCall()
            }

            if (stmt != null) {
                stmts.push(stmt)
                console.log("success");
            }
            // 继续预读一个token
            token = this.tokenizer.peek()

        }
        return new ProgramNode(stmts)
    }

    /*
    * 解析函数声明
    * */
    parseFunctionDecl(): FunctionDecl | null {
        // 跳过预读的token
        this.tokenizer.next()
        let t: Token = this.tokenizer.next()

        if (t.kind == TokenKind.Identifier) {
            // 读取()
            let t1: Token = this.tokenizer.next();
            if (t1.text == "(") {
                let t2 = this.tokenizer.next()
                if (t2.text == ")") {
                    //     解析函数体
                    let functionBody = this.parseFunctionBody()
                    if (functionBody) {
                        return new FunctionDecl(t.text, functionBody)
                    }
                    // 解析函数体失败
                    else {
                        console.log("Error parsing FunctionBody in FunctionDecl")
                        return null
                    }
                } else {
                    console.log("Expecting ')' in FunctionDecl, while we got a " + t.text)
                    return null
                }

            } else {
                console.log("Expecting '(' in FunctionDecl, while we got a " + t.text)
                return null
            }

        }
        // 不是标识符
        else {
            console.log("Expecting a function name, while we got a " + t.text)
            return null
        }

    }

    /*
    * 解析函数体
    * */
    parseFunctionBody(): FunctionBody | null {
        let stmts: FunctionCall[] = [];
        // 跳过预读的token
        let t: Token = this.tokenizer.next();
        if (t.text == "{") {

            while (this.tokenizer.peek().kind == TokenKind.Identifier) {
                let functionCall = this.parseFunctionCall()
                if (functionCall) stmts.push(functionCall)
                else {
                    console.log("Error parsing a FunctionCall in FunctionBody.")
                    return null
                }
            }
            // 读到了非标识符，可能是}，说明函数体解析已经完成
            t = this.tokenizer.next()
            if (t.text == '}') {
                return new FunctionBody(stmts)
            } else {
                console.log("Expecting '}' in FunctionBody, while we got a " + t.text)
                return null
            }
        } else {
            console.log("Expecting '{' in FunctionBody, while we got a " + t.text);
        }

        return null

    }

    /*
    * 解析函数调用
    * */
    parseFunctionCall(): FunctionCall | null {
        let params: string[] = [];
        let t: Token = this.tokenizer.next();
        if (t.kind == TokenKind.Identifier) {
            let t1: Token = this.tokenizer.next()
            // 匹配()
            if (t1.text == "(") {
                let t2: Token = this.tokenizer.next()
                // 读出所有参数
                while (t2.text != ")") {
                    if (t2.kind == TokenKind.StringLiteral) {
                        params.push(t2.text);
                    } else {
                        console.log("Expecting parameter in FunctionCall, while we got a " + t2.text)
                        return null
                    }
                    t2 = this.tokenizer.next();
                    if (t2.text != ")") {
                        if (t2.text == ",") {
                            t2 = this.tokenizer.next();
                        } else {
                            console.log("Expecting a comma in FunctionCall, while we got a " + t2.text)
                            return null
                        }
                    }
                }
                //消化掉一个分号：;
                t2 = this.tokenizer.next();
                // 说明该函数调用语句结束
                if (t2.text == ";") {
                    return new FunctionCall(t.text, params);
                } else {
                    console.log("Expecting a comma in FunctionCall, while we got a " + t2.text)
                    return null
                }
            }
        }
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

function compileAndRun(program: string) {

    // 源代码解析
    console.log("源代码：")
    console.log(program)

    // 词法分析
    console.log("\n词法分析结果：")
    let tokenizer: Tokenizer = new Tokenizer(new CharStream(program))

    while (tokenizer.peek().kind != TokenKind.EOF) {
        console.log(tokenizer.next());
    }
    //重置tokenizer,回到开头。
    tokenizer = new Tokenizer(new CharStream(program));

    // 语法分析
    let programNode: ProgramNode = new Parser(tokenizer).parseProgram()
    console.log("\n语法分析后的AST：")
    programNode.dump("")

    // 语义分析
    new RefResolver().visitProgramNode(programNode)
    console.log("\n语义分析后的AST，注意自定义函数的调用已被消解:");
    programNode.dump("");

    // 运行程序
    console.log("当前运行的程序")

    let retVal = new Intepretor().visitProgramNode(programNode)
    console.log("程序返回值：" + retVal)

}


function test(filename: string) {
    // 读取源代码
    fs.readFile(filename, 'utf8', (err: any, data: string) => {
        if (err) throw err;
        compileAndRun(data)
    })
}

let filename: string = 'program.a'

if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' FILENAME');
    console.log('Using default filename: ' + filename)
} else {
    filename = process.argv[2]
}

test(filename)