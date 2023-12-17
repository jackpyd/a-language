/*
* 语法分析，生成AST
* */


/**
 * 抽象类AST基类，表示AST树的Node节点
 * 使用了设计模式：访问者模式
 */

abstract class AstNode {
    /*
    * 打印对象信息
    * @prefix: 面填充的字符串，通常用于缩进显示
    * */
    public abstract dump(prefix: string): void;

    /*
    * 接收访问者的访问
    * */
    public abstract accept(visitor: AstVisitor): any

}

/**
 * 声明
 * 包括变量声明、函数声明等等
 */

abstract class Decl {

    name: string

    constructor(name: string) {
        this.name = name;
    }
}

/**
 * 函数声明节点
 */

class FunctionDecl extends Decl {
    // 函数体：代码块
    body: Block

    constructor(name: string, body: Block) {
        super(name);
        this.body = body;
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitFunctionDecl(this)
    }

    public dump(prefix: string): void {
        console.log(prefix + "FunctionDecl " + this.name);
        this.body.dump(prefix + "    ");
    }

}

/**
 * 函数体
 */

class Block extends AstNode {
    stmts: Statement[];

    constructor(stmts: Statement[]) {
        super();
        this.stmts = stmts;
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitBlock(this);
    }

    public dump(prefix: string): void {
        console.log(prefix + "Block");
        this.stmts.forEach(x => x.dump(prefix + "    "));
    }

}

/**
 * 程序节点，AST根节点
 * */

class ProgramNode extends Block {

    public accept(visitor: AstVisitor): any {
        return visitor.visitProgram(this);
    }

    dump(prefix: string): void {
        console.log(prefix + "Program")
        this.stmts.forEach(x => x.dump(prefix + "\t"));
    }

}

/**
 * 变量声明
 */
class VariableDecl extends Decl {
    // 变量类型
    varType: string
    // 变量初始化所用的表达式
    init: Expression | null

    constructor(name: string, varType: string, init: Expression | null) {
        super(name)
        this.varType = varType
        this.init = init
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitVariableDecl(this)
    }

    public dump(prefix: string): void {
        console.log(prefix + "VariableDecl " + this.name + ", type: " + this.varType);
        if (this.init == null) {
            console.log(prefix + "no initialization.");
        } else {
            this.init.dump(prefix + "    ");
        }
    }

}

/**
 * 语句节点
 */

abstract class Statement extends AstNode {
}


/**
 * 表达式节点
 */

abstract class Expression extends AstNode {
}

/**
 * 二元表达式
 */

class Binary extends Expression {
    op: string;      //运算符
    exp1: Expression; //左边的表达式
    exp2: Expression; //右边的表达式


    constructor(op: string, exp1: Expression, exp2: Expression) {
        super();
        this.op = op;
        this.exp1 = exp1;
        this.exp2 = exp2;
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitBinary(this);
    }

    public dump(prefix: string): void {
        console.log(prefix + "Binary:" + this.op);
        this.exp1.dump(prefix + "    ");
        this.exp2.dump(prefix + "    ");
    }


}

/**
 * 表达式语句
 *  表达式后加分号
 */

class ExpressionStatement extends Statement {
    exp: Expression;


    constructor(exp: Expression) {
        super();
        this.exp = exp;
    }

    accept(visitor: AstVisitor): any {
        return visitor.visitExpressionStatement(this);
    }

    public dump(prefix: string): void {
        console.log(prefix + "ExpressionStatement");
        this.exp.dump(prefix + "    ");
    }

}

/**
 * 函数调用
 */

class FunctionCall extends AstNode {
    name: string;
    parameters: Expression[];
    decl: FunctionDecl | null = null;  //指向函数的声明
    constructor(name: string, parameters: Expression[]) {
        super();
        this.name = name;
        this.parameters = parameters;
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitFunctionCall(this);
    }

    public dump(prefix: string): void {
        console.log(prefix + "FunctionCall " + this.name + (this.decl != null ? ", resolved" : ", not resolved"));
        this.parameters.forEach(x => x.dump(prefix + "    "));
    }
}


/**
 * 变量引用
 */

class Variable extends Expression {
    name: string;
    decl: VariableDecl | null = null; //指向变量声明
    constructor(name: string) {
        super();
        this.name = name;
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitVariable(this);
    }

    public dump(prefix: string): void {
        console.log(prefix + "Variable: " + this.name + (this.decl != null ? ", resolved" : ", not resolved"));
    }
}

/**
 * 字符串字面量
 */

class StringLiteral extends Expression {
    value: string;

    constructor(value: string) {
        super();
        this.value = value;
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitStringLiteral(this);
    }

    public dump(prefix: string): void {
        console.log(prefix + this.value);
    }
}

/**
 * 整型字面量
 */

class IntegerLiteral extends Expression {
    value: number;

    constructor(value: number) {
        super();
        this.value = value;
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitIntegerLiteral(this);
    }

    public dump(prefix: string): void {
        console.log(prefix + this.value);
    }
}

/**
 * 浮点数字面量
 */

class DecimalLiteral extends Expression {
    value: number;

    constructor(value: number) {
        super();
        this.value = value;
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitDecimalLiteral(this);
    }

    public dump(prefix: string): void {
        console.log(prefix + this.value);
    }
}

/**
 * null字面量
 */

class NullLiteral extends Expression {
    value: null = null;

    constructor() {
        super();
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitNullLiteral(this);
    }

    public dump(prefix: string): void {
        console.log(prefix + this.value);
    }
}

/**
 * bool字面量
 */


class BooleanLiteral extends Expression {

    value: boolean

    constructor(value: boolean) {
        super();
        this.value = value;
    }

    public accept(visitor: AstVisitor): any {
        return visitor.visitBooleanLiteral(this);
    }

    public dump(prefix: string): void {
        console.log(prefix + this.value);
    }
}


/*
* 对AST进行遍历
*   定义了缺省的遍历方法，子类可以覆盖这些方法，修改遍历方式
* */

abstract class AstVisitor {

    // 访问者提供visit接口
    visit(node: AstNode): any {
        return node.accept(this)
    }

    // 程序根节点
    visitProgram(programNode: ProgramNode): any {
        let retVal: any;
        for (let x of programNode.stmts) {
            retVal = this.visit(x)
        }
        return retVal
    }

    // 函数声明
    visitFunctionDecl(functionDecl: FunctionDecl): any {
        return this.visitBlock(functionDecl.body)
    }

    // 变量声明
    visitVariableDecl(variableDecl: VariableDecl): any {
        if (variableDecl.init != null) {
            return this.visit(variableDecl.init);
        }
    }

    // 函数体
    visitBlock(block: Block): any {
        let retVal: any;
        for (let x of block.stmts) {
            // x.accept(this)
            // visit模式，基本上都这么写
            retVal = this.visit(x)
        }
        return retVal;
    }

    // 访问函数调用
    visitFunctionCall(functionCall: FunctionCall): any {
        return undefined
    }

    // 表达式语句
    visitExpressionStatement(stmt: ExpressionStatement): any {
        return this.visit(stmt.exp)
    }

    // 二元操作符
    visitBinary(exp: Binary): any {
        this.visit(exp.exp1)
        this.visit(exp.exp2)
    }

    // 整数字面量
    visitIntegerLiteral(exp: IntegerLiteral): any {
        return exp.value
    }

    // 浮点数字面量
    visitDecimalLiteral(exp: DecimalLiteral): any {
        return exp.value
    }

    // 字符串字面量
    visitStringLiteral(exp: StringLiteral): any {
        return exp.value
    }

    // null
    visitNullLiteral(exp: NullLiteral): any {
        return exp.value
    }

    // bool
    visitBooleanLiteral(exp: BooleanLiteral): any {
        return exp.value
    }

    // 变量
    visitVariable(variable: Variable): any {
        return undefined
    }


}

export {
    ProgramNode,
    Block,
    Decl,
    VariableDecl,
    FunctionDecl, FunctionCall,
    Statement, Expression,
    ExpressionStatement,
    Binary,
    IntegerLiteral,
    DecimalLiteral,
    StringLiteral,
    BooleanLiteral,
    Variable,
    AstVisitor
}