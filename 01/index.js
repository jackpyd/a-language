/**
 * 语法规则：
 *   prog: ( functionDecl | functionCall )*
 *   functionDecl: "function" Indetifier "("  ")" functionBody
 *   functionBody: "{" functionCal* "}"
 *   functionCall: Indentifier "(" parameterLists? ")"
 *  parameterLists: StringLiteral ( "," StringLiteral )*
 *
 */
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
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Keyword"] = 0] = "Keyword";
    TokenKind[TokenKind["Identifier"] = 1] = "Identifier";
    TokenKind[TokenKind["StringLiteral"] = 2] = "StringLiteral";
    TokenKind[TokenKind["Seperator"] = 3] = "Seperator";
    TokenKind[TokenKind["Operator"] = 4] = "Operator";
    TokenKind[TokenKind["EOF"] = 5] = "EOF";
})(TokenKind || (TokenKind = {}));
// 当前程序是由一系列Token组成的数组
var tokenArray = [
    { kind: TokenKind.Keyword, text: 'function' },
    { kind: TokenKind.Identifier, text: 'sayHello' },
    { kind: TokenKind.Seperator, text: '(' },
    { kind: TokenKind.Seperator, text: ')' },
    { kind: TokenKind.Seperator, text: '{' },
    { kind: TokenKind.Identifier, text: 'println' },
    { kind: TokenKind.Seperator, text: '(' },
    { kind: TokenKind.StringLiteral, text: 'Hello World!' },
    { kind: TokenKind.Seperator, text: ')' },
    { kind: TokenKind.Seperator, text: ';' },
    { kind: TokenKind.Seperator, text: '}' },
    { kind: TokenKind.Identifier, text: 'sayHello' },
    { kind: TokenKind.Seperator, text: '(' },
    { kind: TokenKind.Seperator, text: ')' },
    { kind: TokenKind.Seperator, text: ';' },
    { kind: TokenKind.EOF, text: '' }
];
var EOFToken = { kind: TokenKind.EOF, text: '' };
/**
 * 词法分析器：用于语法分析器获取Token
 */
var Tokenizer = /** @class */ (function () {
    function Tokenizer(tokens) {
        this.pos = 0;
        this.tokens = tokens;
    }
    //  返回下一个token
    Tokenizer.prototype.next = function () {
        // 说明到达了程序的末尾
        if (this.pos > this.tokens.length) {
            return EOFToken;
        }
        else {
            return this.tokens[this.pos++];
        }
    };
    // 获取当前解析到token的位置
    Tokenizer.prototype.position = function () {
        return this.pos;
    };
    // 返回到某个token的位置
    Tokenizer.prototype.back = function (newPos) {
        this.pos = newPos;
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
        return new ProgramNode(stmts);
    };
    /*
    * 解析函数声明
    * */
    Parser.prototype.parseFunctionDecl = function () {
        var oldPos = this.tokenizer.position();
        var t = this.tokenizer.next();
        // 以function开头
        if (t.kind == TokenKind.Keyword && t.text == "function") {
            t = this.tokenizer.next();
            if (t.kind == TokenKind.Identifier) {
                var t1 = this.tokenizer.next();
                if (t1.text == "(") {
                    var t2 = this.tokenizer.next();
                    if (t2.text == ")") {
                        // parseFunctionBody
                        var functionBody = this.parseFunctionBody();
                        // 返回函数声明对象
                        if (FunctionBody.isFunctionBodyNode(functionBody)) {
                            return new FunctionDecl(t.text, functionBody);
                        }
                    }
                    else {
                        console.log("Expecting ')' in FunctionDecl, while we got a " + t.text);
                        return;
                    }
                }
            }
        }
        // 解析不成功,回溯，返回null
        this.tokenizer.back(oldPos);
        return null;
    };
    /*
    * 解析函数体
    * */
    Parser.prototype.parseFunctionBody = function () {
        var oldPos = this.tokenizer.position();
        var stmts = [];
        var t = this.tokenizer.next();
        if (t.text == "{") {
            var functionCall = this.parseFunctionCall();
            //  解析函数体
            while (FunctionCall.isFunctionCallNode(functionCall)) {
                stmts.push(functionCall);
                functionCall = this.parseFunctionCall();
            }
            t = this.tokenizer.next();
            if (t.text == "}") {
                return new FunctionBody(stmts);
            }
            else {
                console.log("Expecting '}' in FunctionBody, while we got a " + t.text);
                return;
            }
        }
        else {
            console.log("Expecting '{' in FunctionBody, while we got a " + t.text);
        }
        // 同样，解析不成功，就回溯，返回null
        this.tokenizer.back(oldPos);
        return null;
    };
    /*
    * 解析函数调用
    * */
    Parser.prototype.parseFunctionCall = function () {
        var oldPos = this.tokenizer.position();
        var params = [];
        var t = this.tokenizer.next();
        if (t.kind == TokenKind.Identifier) {
            var t1 = this.tokenizer.next();
            if (t1.text == "(") {
                var t2 = this.tokenizer.next();
                while (t2.text != ")") {
                    if (t2.kind == TokenKind.StringLiteral) {
                        params.push(t2.text);
                    }
                    else {
                        console.log("Expecting parameter in FunctionCall, while we got a " + t2.text);
                        return; //出错时，就不在错误处回溯了。
                    }
                    t2 = this.tokenizer.next();
                    if (t2.text != ")") {
                        if (t2.text == ",") {
                            t2 = this.tokenizer.next();
                        }
                        else {
                            console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
                            return;
                        }
                    }
                }
                //消化掉一个分号：;
                t2 = this.tokenizer.next();
                if (t2.text == ";") {
                    return new FunctionCall(t.text, params);
                }
                else {
                    console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
                    return;
                }
            }
        }
        //如果解析不成功，回溯，返回null。
        this.tokenizer.back(oldPos);
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
function compileAndRun() {
    // 词法分析
    var tokenizer = new Tokenizer(tokenArray);
    for (var _i = 0, tokenArray_1 = tokenArray; _i < tokenArray_1.length; _i++) {
        var token = tokenArray_1[_i];
        console.log(token);
    }
    // 语法分析
    var program = new Parser(tokenizer).parseProgram();
    console.log("语法分析后的AST：");
    program.dump("");
    // 语义分析
    new RefResolver().visitProgramNode(program);
    console.log("\n语义分析后的AST，注意自定义函数的调用已被消解:");
    program.dump("");
    // 运行程序
    console.log("当前运行的程序");
    var retVal = new Intepretor().visitProgramNode(program);
    console.log("程序返回值：" + retVal);
}
compileAndRun();
