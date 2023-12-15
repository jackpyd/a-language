"use strict";
/**
 * 词法分析，将语法升级为LL算法
 *
 * 当前词法规则：
 *   Identifier: [a-zA-Z_][a-zA-Z0-9_]*
 * */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 字符串流操作
 */
var fs = require('fs');
// 处理命令行参数
var process = require("process");
var CharStream = /** @class */ (function () {
    function CharStream(data) {
        this.pos = 0;
        this.line = 1;
        this.col = 0;
        this.data = data;
    }
    // 预读下一个字符，但不移动指针
    CharStream.prototype.peek = function () {
        return this.data.charAt(this.pos);
    };
    // 读取下一个字符，移动指针
    CharStream.prototype.next = function () {
        var char = this.data.charAt(this.pos++);
        if (char == "\n") {
            this.line++;
            this.col = 0;
        }
        else {
            this.col++;
        }
        return char;
    };
    // 判断是否已经到了结尾
    CharStream.prototype.eof = function () {
        return this.peek() == '';
    };
    return CharStream;
}());
// Token的类型
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Keyword"] = 0] = "Keyword";
    TokenKind[TokenKind["Identifier"] = 1] = "Identifier";
    TokenKind[TokenKind["StringLiteral"] = 2] = "StringLiteral";
    TokenKind[TokenKind["Seperator"] = 3] = "Seperator";
    TokenKind[TokenKind["Operator"] = 4] = "Operator";
    TokenKind[TokenKind["EOF"] = 5] = "EOF";
})(TokenKind || (TokenKind = {}));
var EOFToken = { kind: TokenKind.EOF, text: '' };
/**
 * 词法分析器：用于语法分析器获取Token
 */
var Tokenizer = /** @class */ (function () {
    function Tokenizer(stream) {
        this.nextToken = { kind: TokenKind.EOF, text: '' };
        this.stream = stream;
    }
    //  返回当前Token，并移向下一个Token
    Tokenizer.prototype.next = function () {
        // 第一次读取，先解析一个Token
        if (this.nextToken.kind == TokenKind.EOF
            && !this.stream.eof()) {
            this.nextToken = this.getAToken();
        }
        var lastToken = this.nextToken;
        // 预读一个Token
        this.nextToken = this.getAToken();
        return lastToken;
    };
    // 返回当前Token，但不移动当前位置
    Tokenizer.prototype.peek = function () {
        if (this.nextToken.kind == TokenKind.EOF
            && !this.stream.eof()) {
            this.nextToken = this.getAToken();
        }
        return this.nextToken;
    };
    // 从字符串流中返回一个新的Token
    Tokenizer.prototype.getAToken = function () {
        // 跳过空白字符
        this.skipWhiteSpaces();
        // 读到程序末尾
        if (this.stream.eof()) {
            return EOFToken;
        }
        else {
            // 预读一个符号
            var ch = this.stream.peek();
            // 标识符
            if (this.isLetter(ch) || this.isDigit(ch)) {
                return this.parseIdentifer();
            }
            // 字面量
            else if (ch == '"') {
                return this.parseStringLiteral();
            }
            // 分割符
            else if (ch == '(' || ch == ')' || ch == '{' || ch == '}' || ch == ';' || ch == ',') {
                this.stream.next();
                return {
                    kind: TokenKind.Seperator,
                    text: ch
                };
            }
            else if (ch == '/') {
                this.stream.next();
                var ch1 = this.stream.peek();
                // 注释
                if (ch1 == '*') {
                    this.skipMultipleLineComment();
                    return this.getAToken();
                }
                else if (ch1 == '/') {
                    this.skipSingleLineComment();
                    return this.getAToken();
                }
                else if (ch1 == '=') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '/=' };
                }
                else {
                    return { kind: TokenKind.Operator, text: '/' };
                }
            }
            else if (ch == '+') {
                this.stream.next();
                var ch1 = this.stream.peek();
                if (ch1 == '+') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '++' };
                }
                else if (ch1 == '=') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '+=' };
                }
                else {
                    return {
                        kind: TokenKind.Operator,
                        text: '+'
                    };
                }
            }
            else if (ch == '-') {
                this.stream.next();
                var ch1 = this.stream.peek();
                if (ch1 == '-') {
                    this.stream.next();
                    return {
                        kind: TokenKind.Operator,
                        text: '--'
                    };
                }
                else if (ch1 == '=') {
                    this.stream.next();
                    return {
                        kind: TokenKind.Operator,
                        text: '-='
                    };
                }
                else {
                    return {
                        kind: TokenKind.Operator,
                        text: '-'
                    };
                }
            }
            else if (ch == '*') {
                this.stream.next();
                var ch1 = this.stream.peek();
                if (ch1 == '*') {
                    this.stream.next();
                    return {
                        kind: TokenKind.Operator,
                        text: '**'
                    };
                }
                else if (ch1 == '=') {
                    this.stream.next();
                    return {
                        kind: TokenKind.Operator,
                        text: '*='
                    };
                }
                else {
                    return {
                        kind: TokenKind.Operator,
                        text: '*'
                    };
                }
            }
            else {
                // 去掉不能识别的字符
                console.log("Unrecognized pattern meeting ': " + ch + "', at" + this.stream.line + " col: " + this.stream.col);
                this.stream.next();
                return this.getAToken();
            }
        }
    };
    // 解析字符串字面量
    Tokenizer.prototype.parseStringLiteral = function () {
        var token = {
            kind: TokenKind.StringLiteral,
            text: ''
        };
        // 第一个字符已经被判断过了
        this.stream.next();
        while (!this.stream.eof() && this.stream.peek() != '"') {
            token.text += this.stream.next();
        }
        if (this.stream.peek() == '"') {
            this.stream.next();
        }
        else {
            console.log("Expecting an \" at line: " + this.stream.line + " col: " + this.stream.col);
        }
        return token;
    };
    // 解析标识符，从中检索关键字
    Tokenizer.prototype.parseIdentifer = function () {
        var token = {
            kind: TokenKind.Identifier,
            text: ""
        };
        // 第一个字符在调用者处已经判断
        token.text += this.stream.next();
        // 读入后续的字符
        while (!this.stream.eof() &&
            this.isLetterDigitOrUnderScore(this.stream.peek())) {
            token.text += this.stream.next();
        }
        // 识别关键字
        if (token.text == 'function') {
            token.kind = TokenKind.Keyword;
        }
        return token;
    };
    // 跳过单行注释
    Tokenizer.prototype.skipSingleLineComment = function () {
        // 第一个已经跳过
        this.stream.next();
        // 一直到回车或者eof
        while (this.stream.peek() != '\n' && !this.stream.eof()) {
            this.stream.next();
        }
    };
    // 跳过多行注释
    Tokenizer.prototype.skipMultipleLineComment = function () {
        // 跳过 *
        this.stream.next();
        if (!this.stream.eof()) {
            var ch1 = this.stream.next();
            while (!this.stream.eof()) {
                var ch2 = this.stream.next();
                if (ch1 == '*' && ch2 == '/') {
                    return;
                }
                ch1 = ch2;
            }
        }
        // 匹配不上，报错
        console.log("Failed to find matching */ for multiple line comments at ': "
            + this.stream.line + " col: " + this.stream.col);
    };
    // 跳过空字符
    Tokenizer.prototype.skipWhiteSpaces = function () {
        while (this.isWhiteSpace(this.stream.peek())) {
            this.stream.next();
        }
    };
    // 当前字符是否为字母、数字或下划线
    Tokenizer.prototype.isLetterDigitOrUnderScore = function (ch) {
        return this.isLetter(ch) ||
            this.isDigit(ch) ||
            this.isUnderScore(ch);
    };
    // 是否为下划线符号
    Tokenizer.prototype.isUnderScore = function (ch) {
        return ch == '_';
    };
    // 判断字符是否为空白字符
    Tokenizer.prototype.isWhiteSpace = function (ch) {
        return ch == ' ' || ch == '\n' || ch == '\t';
    };
    // 判断字符是否为数字
    Tokenizer.prototype.isDigit = function (ch) {
        return (ch > '0' && ch < '9');
    };
    // 判断字符是否为字母
    Tokenizer.prototype.isLetter = function (ch) {
        return (ch >= 'A' && ch <= 'Z' || ch >= 'a' && ch <= 'z');
    };
    return Tokenizer;
}());
// =======语法分析===========
/**
 * 抽象类，表示AST树的Node节点
 */
var AstNode = /** @class */ (function () {
    function AstNode() {
    }
    return AstNode;
}());
/*
* 语句：包含函数声明和函数调用
* */
var Statement = /** @class */ (function (_super) {
    __extends(Statement, _super);
    function Statement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // is 关键字经常用来封装"类型判断函数"，
    // 通过和函数返回值的比较，从而缩小参数的类型范围，
    // 所以类型谓词 is 也是一种类型保护。
    // 返回值是 Statement 类型
    Statement.isStatementNode = function (node) {
        if (!node) {
            return false;
        }
        else {
            return true;
        }
    };
    return Statement;
}(AstNode));
/*
* 程序节点，是AST根节点
* */
var ProgramNode = /** @class */ (function (_super) {
    __extends(ProgramNode, _super);
    function ProgramNode(stmts) {
        var _this = _super.call(this) || this;
        _this.stmts = stmts;
        return _this;
    }
    ProgramNode.prototype.dump = function (prefix) {
        console.log(prefix + "Program");
        this.stmts.forEach(function (x) { return x.dump(prefix + "\t"); });
    };
    return ProgramNode;
}(AstNode));
/*
* 函数声明节点
* */
var FunctionDecl = /** @class */ (function (_super) {
    __extends(FunctionDecl, _super);
    function FunctionDecl(name, body) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.body = body;
        return _this;
    }
    FunctionDecl.prototype.dump = function (prefix) {
        console.log(prefix + "FunctionDecl " + this.name);
        this.body.dump(prefix + "\t");
    };
    return FunctionDecl;
}(Statement));
/*
* 函数体节点
* */
var FunctionBody = /** @class */ (function (_super) {
    __extends(FunctionBody, _super);
    function FunctionBody(stmts) {
        var _this = _super.call(this) || this;
        _this.stmts = stmts;
        return _this;
    }
    FunctionBody.isFunctionBodyNode = function (node) {
        if (!node) {
            return false;
        }
        return Object.getPrototypeOf(node) == FunctionBody.prototype;
    };
    FunctionBody.prototype.dump = function (prefix) {
        console.log(prefix + "FunctionBody");
        this.stmts.forEach(function (x) { return x.dump(prefix + "\t"); });
    };
    return FunctionBody;
}(AstNode));
/*
* 函数调用
* */
var FunctionCall = /** @class */ (function (_super) {
    __extends(FunctionCall, _super);
    function FunctionCall(name, parameters) {
        var _this = _super.call(this) || this;
        // 指向函数声明
        _this.definition = null;
        _this.name = name;
        _this.parameters = parameters;
        return _this;
    }
    FunctionCall.isFunctionCallNode = function (node) {
        if (!node)
            return false;
        return Object.getPrototypeOf(node) == FunctionCall.prototype;
    };
    FunctionCall.prototype.dump = function (prefix) {
        console.log(prefix + "FunctionCall " + this.name + (this.definition != null ?
            ", resolved" : ", not resolved"));
        this.parameters.forEach(function (x) { return console.log(prefix + "\t" + "Parameter: " + x); });
    };
    return FunctionCall;
}(Statement));
/*
* 解析器
* */
var Parser = /** @class */ (function () {
    function Parser(tokenizer) {
        this.tokenizer = tokenizer;
    }
    Parser.prototype.parseProgram = function () {
        var stmts = [];
        var stmt = null;
        // 预读token
        var token = this.tokenizer.peek();
        while (token != EOFToken) {
            if (token.kind == TokenKind.Keyword && token.text == 'function') {
                stmt = this.parseFunctionDecl();
            }
            else if (token.kind == TokenKind.Identifier) {
                stmt = this.parseFunctionCall();
            }
            if (stmt != null) {
                stmts.push(stmt);
                console.log("success");
            }
            // 继续预读一个token
            token = this.tokenizer.peek();
        }
        return new ProgramNode(stmts);
    };
    /*
    * 解析函数声明
    * */
    Parser.prototype.parseFunctionDecl = function () {
        // 跳过预读的token
        this.tokenizer.next();
        var t = this.tokenizer.next();
        if (t.kind == TokenKind.Identifier) {
            // 读取()
            var t1 = this.tokenizer.next();
            if (t1.text == "(") {
                var t2 = this.tokenizer.next();
                if (t2.text == ")") {
                    //     解析函数体
                    var functionBody = this.parseFunctionBody();
                    if (functionBody) {
                        return new FunctionDecl(t.text, functionBody);
                    }
                    // 解析函数体失败
                    else {
                        console.log("Error parsing FunctionBody in FunctionDecl");
                        return null;
                    }
                }
                else {
                    console.log("Expecting ')' in FunctionDecl, while we got a " + t.text);
                    return null;
                }
            }
            else {
                console.log("Expecting '(' in FunctionDecl, while we got a " + t.text);
                return null;
            }
        }
        // 不是标识符
        else {
            console.log("Expecting a function name, while we got a " + t.text);
            return null;
        }
    };
    /*
    * 解析函数体
    * */
    Parser.prototype.parseFunctionBody = function () {
        var stmts = [];
        // 跳过预读的token
        var t = this.tokenizer.next();
        if (t.text == "{") {
            while (this.tokenizer.peek().kind == TokenKind.Identifier) {
                var functionCall = this.parseFunctionCall();
                if (functionCall)
                    stmts.push(functionCall);
                else {
                    console.log("Error parsing a FunctionCall in FunctionBody.");
                    return null;
                }
            }
            // 读到了非标识符，可能是}，说明函数体解析已经完成
            t = this.tokenizer.next();
            if (t.text == '}') {
                return new FunctionBody(stmts);
            }
            else {
                console.log("Expecting '}' in FunctionBody, while we got a " + t.text);
                return null;
            }
        }
        else {
            console.log("Expecting '{' in FunctionBody, while we got a " + t.text);
        }
        return null;
    };
    /*
    * 解析函数调用
    * */
    Parser.prototype.parseFunctionCall = function () {
        var params = [];
        var t = this.tokenizer.next();
        if (t.kind == TokenKind.Identifier) {
            var t1 = this.tokenizer.next();
            // 匹配()
            if (t1.text == "(") {
                var t2 = this.tokenizer.next();
                // 读出所有参数
                while (t2.text != ")") {
                    if (t2.kind == TokenKind.StringLiteral) {
                        params.push(t2.text);
                    }
                    else {
                        console.log("Expecting parameter in FunctionCall, while we got a " + t2.text);
                        return null;
                    }
                    t2 = this.tokenizer.next();
                    if (t2.text != ")") {
                        if (t2.text == ",") {
                            t2 = this.tokenizer.next();
                        }
                        else {
                            console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
                            return null;
                        }
                    }
                }
                //消化掉一个分号：;
                t2 = this.tokenizer.next();
                // 说明该函数调用语句结束
                if (t2.text == ";") {
                    return new FunctionCall(t.text, params);
                }
                else {
                    console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
                    return null;
                }
            }
        }
        return null;
    };
    return Parser;
}());
//============语义分析===========
/*
* 对AST进行遍历
* */
var AstVisitor = /** @class */ (function () {
    function AstVisitor() {
    }
    AstVisitor.prototype.visitProgramNode = function (programNode) {
        var retVal;
        for (var _i = 0, _a = programNode.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            if (typeof x.body === 'object') {
                retVal = this.visitFunctionDecl(x);
            }
            else {
                retVal = this.visitFunctionCall(x);
            }
        }
        return retVal;
    };
    AstVisitor.prototype.visitFunctionDecl = function (functionDecl) {
        return this.visitFunctionBody(functionDecl.body);
    };
    AstVisitor.prototype.visitFunctionBody = function (functionBody) {
        var retVal;
        for (var _i = 0, _a = functionBody.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            retVal = this.visitFunctionCall(x);
        }
        return retVal;
    };
    AstVisitor.prototype.visitFunctionCall = function (functionCall) {
        return undefined;
    };
    return AstVisitor;
}());
// 对函数调用做引用消解
var RefResolver = /** @class */ (function (_super) {
    __extends(RefResolver, _super);
    function RefResolver() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.programNode = null;
        return _this;
    }
    RefResolver.prototype.visitProgramNode = function (programNode) {
        this.programNode = programNode;
        for (var _i = 0, _a = programNode.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            var functionCall = x;
            if (typeof functionCall.parameters === 'object') {
                this.resolveFunctionCall(programNode, functionCall);
            }
            else {
                this.visitFunctionDecl(x);
            }
        }
    };
    RefResolver.prototype.visitFunctionBody = function (functionBody) {
        if (this.programNode != null) {
            for (var _i = 0, _a = functionBody.stmts; _i < _a.length; _i++) {
                var x = _a[_i];
                return this.resolveFunctionCall(this.programNode, x);
            }
        }
    };
    // 函数引用消解
    RefResolver.prototype.resolveFunctionCall = function (programNode, functionCall) {
        var functionDecl = this.findFunctionDecl(programNode, functionCall.name);
        //  找到了函数申明
        if (functionDecl != null) {
            functionCall.definition = functionDecl;
        }
        else {
            // 如果没有找到用户申明的函数，则可能是系统函数
            if (functionCall.name != "println") {
                console.log("Error: cannot find definition of function " + functionCall.name);
            }
        }
    };
    // 查找函数的声明
    RefResolver.prototype.findFunctionDecl = function (programNode, name) {
        for (var _i = 0, _a = programNode.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            var functionDecl = x;
            if (typeof functionDecl.body === 'object' && functionDecl.name == name) {
                return functionDecl;
            }
        }
        return null;
    };
    return RefResolver;
}(AstVisitor));
//============解释器===========
/*
* 遍历AST执行函数调用
* */
var Intepretor = /** @class */ (function (_super) {
    __extends(Intepretor, _super);
    function Intepretor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Intepretor.prototype.visitProgramNode = function (programNode) {
        var retVal;
        for (var _i = 0, _a = programNode.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            var functionCall = x;
            if (typeof functionCall.parameters === 'object') {
                retVal = this.runFunction(functionCall);
            }
        }
        return retVal;
    };
    Intepretor.prototype.visitFunctionBody = function (functionBody) {
        var retVal;
        for (var _i = 0, _a = functionBody.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            retVal = this.runFunction(x);
        }
        return retVal;
    };
    Intepretor.prototype.runFunction = function (functionCall) {
        // 执行println函数
        if (functionCall.name == "println") {
            if (functionCall.parameters.length) {
                console.log(functionCall.parameters[0]);
            }
            else {
                console.log();
            }
            return 0;
        }
        else {
            //     找到函数定义，继续遍历函数体
            if (functionCall.definition != null) {
                this.visitFunctionBody(functionCall.definition.body);
            }
        }
    };
    return Intepretor;
}(AstVisitor));
/*
* 主程序：编译并运行
* */
function compileAndRun(program) {
    // 源代码解析
    console.log("源代码：");
    console.log(program);
    // 词法分析
    console.log("\n词法分析结果：");
    var tokenizer = new Tokenizer(new CharStream(program));
    while (tokenizer.peek().kind != TokenKind.EOF) {
        console.log(tokenizer.next());
    }
    //重置tokenizer,回到开头。
    tokenizer = new Tokenizer(new CharStream(program));
    // 语法分析
    var programNode = new Parser(tokenizer).parseProgram();
    console.log("\n语法分析后的AST：");
    programNode.dump("");
    // 语义分析
    new RefResolver().visitProgramNode(programNode);
    console.log("\n语义分析后的AST，注意自定义函数的调用已被消解:");
    programNode.dump("");
    // 运行程序
    console.log("当前运行的程序");
    var retVal = new Intepretor().visitProgramNode(programNode);
    console.log("程序返回值：" + retVal);
}
function test(filename) {
    // 读取源代码
    fs.readFile(filename, 'utf8', function (err, data) {
        if (err)
            throw err;
        compileAndRun(data);
    });
}
var filename = 'program.a';
if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' FILENAME');
    console.log('Using default filename:' + filename);
}
else {
    filename = process.argv[2];
}
test(filename);
