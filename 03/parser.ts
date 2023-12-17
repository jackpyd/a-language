/**
 * 语法解析器
 * 当前语法规则：
 * prog = statementList? EOF
 * statementList = (variableDecl | functionDecl | expressionStatement)+
 * variableDecl : 'let' Identifier typeAnnotation？ ('=' singleExpression) ';'
 * typeAnnotation : ':' typeName
 * functionDecl: "function" Identifier "(" ")"  functionBody
 * functionBody : '{' statementList? '}'
 * statement: functionDecl | expressionStatement
 * expressionStatement: expression ';'
 * expression: primary (binOP primary)*
 * primary: StringLiteral | DecimalLiteral | IntegerLiteral | functionCall | '(' expression ')'
 * binOP: '+' | '-' | '*' | '/' | '=' | '+=' | '-=' | '*=' | '/=' | '==' | '!=' | '<=' | '>=' | '<'
 *      | '>' | '&&'| '||'|...
 * functionCall : Identifier '(' parameterList? ')'
 * parameterList : expression (',' expression)*
 */


import {EOFToken, Scanner, Token, TokenKind} from "./scanner";
import {
    Binary,
    Block, BooleanLiteral,
    DecimalLiteral,
    Expression,
    ExpressionStatement,
    FunctionCall,
    FunctionDecl,
    IntegerLiteral,
    ProgramNode,
    Statement,
    StringLiteral,
    Variable,
    VariableDecl
} from "./ast";

/**
 * 语法解析器
 * 1. 作为入口，解析整个程序
 * 2. 用作下级节点的入口，只解析一部分程序
 */

class Parser {

    scanner: Scanner

    // 二元运算符优先级
    private opPriority = new Map([
        ['=', 2],
        ['+=', 2],
        ['-=', 2],
        ['*=', 2],
        ['-=', 2],
        ['%=', 2],
        ['&=', 2],
        ['|=', 2],
        ['^=', 2],
        ['~=', 2],
        ['<<=', 2],
        ['>>=', 2],
        ['>>>=', 2],
        ['||', 4],
        ['&&', 5],
        ['|', 6],
        ['^', 7],
        ['&', 8],
        ['==', 9],
        ['===', 9],
        ['!=', 9],
        ['!==', 9],
        ['>', 10],
        ['>=', 10],
        ['<', 10],
        ['<=', 10],
        ['<<', 11],
        ['>>', 11],
        ['>>>', 11],
        ['+', 12],
        ['-', 12],
        ['*', 13],
        ['/', 13],
        ['%', 13],
    ])

    /**
     * 获取二元运算符的优先级
     * op: 二元运算符
     */
    private getPriority(op: string): number {
        let ret: number | undefined = this.opPriority.get(op)
        if (typeof ret == 'undefined') {
            return -1
        } else {
            return ret
        }

    }

    constructor(scanner: Scanner) {
        this.scanner = scanner;
    }

    /**
     * 解析Program
     * */
    parseProgramNode(): ProgramNode {
        return new ProgramNode(this.parseStatementList())
    }

    /**
     * 解析语句列表
     */
    parseStatementList(): Statement[] {
        let stmts: Statement[] = []
        let t: Token = this.scanner.peek()
        // follow 集合中有EOF和'}'元素分别用于program和functionBody的匹配
        while (t != EOFToken && t.text != '}') {
            // 解析语句
            let stmt: Statement | null = this.parseStatement()

            if (stmt) {
                stmts.push(stmt)
            } else {
                // 暂时不处理
                // 理想情况应该抛出错误
            }
            // 再次预读一个Token
            t = this.scanner.peek()
        }

        return stmts

    }

    /**
     * 解析语句
     *  遇到函数调用、变量声明和变量赋值都是以Identifier开始的情况，所以要预读2个Token
     */

    parseStatement(): Statement | null {
        // 预读一个Token
        let t: Token = this.scanner.peek()
        // 函数
        if (t.kind == TokenKind.Keyword && t.text == 'function') {
            // 解析函数声明
            return this.parseFunctionDecl()
        }
        // 变量声明
        else if (t.kind == TokenKind.Keyword && t.text == 'let') {
            // 解析变量声明
            return this.parseVariableDecl()
        }
        // 表达式语句
        else if (t.kind == TokenKind.Identifier || t.kind == TokenKind.DecimalLiteral ||
            t.kind == TokenKind.IntegerLiteral || t.kind == TokenKind.StringLiteral ||
            t.kind == TokenKind.BooleanLiteral ||
            t.text == '('
        ) {
            // 解析表达式语句
            return this.parseExpressionStatement()
        } else {
            // 无法识别语句
            console.log("Can not recognize a expression starting with: " + this.scanner.peek().text)
            return null

        }
    }

    /**
     * 解析变量声明
     *  variableDecl : 'let'? Identifier typeAnnotation？ ('=' singleExpression) ';'
     *  typeAnnotation : ':' typeName
     */

    parseVariableDecl(): VariableDecl | null {
        // 跳过let，因为之前已经识别到了let
        this.scanner.next()

        let t: Token = this.scanner.next()
        if (t.kind == TokenKind.Identifier) {
            // 变量名
            let varName: string = t.text
            // 默认变量类型
            let varType: string = 'any'
            // 初始化表达式
            let init: Expression | null = null

            // 类型注解
            let t1: Token = this.scanner.peek()
            if (t1.text == ':') {
                this.scanner.next()
                t1 = this.scanner.peek()
                // 识别类型
                if (t1.kind == TokenKind.Identifier) {
                    this.scanner.next()
                    varType = t1.text
                    t1 = this.scanner.peek()
                } else {
                    console.log("Error parsing type annotation in VariableDecl");
                    return null;
                }
            }

            // 初始化
            if (t1.text == '=') {
                this.scanner.next()
                init = this.parseExpression()
            }
            // 分号
            t1 = this.scanner.peek()
            if (t1.text == ';') {
                // 消化分号
                this.scanner.next()
                // 返回变量声明
                return new VariableDecl(varName, varType, init)
            } else {
                // 未匹配到分号
                console.log("Expecting ; at the end of varaible declaration, while we meet " + t1.text)
                return null
            }
        } else {
            // 未匹配到标识符，即变量名
            console.log("Expecting variable name in VariableDecl, while we meet " + t.text)
            return null

        }

    }

    /**
     * 解析函数声明
     *  functionDecl: "function" Identifier "(" ")"  functionBody
     *  functionBody : '{' statementList? '}'
     */
    parseFunctionDecl(): FunctionDecl | null {
        this.scanner.next()

        let t: Token = this.scanner.next()
        let functionName = t.text
        if (t.kind == TokenKind.Identifier) {
            // 读取()，目前不支持带参函数
            let t1 = this.scanner.next()
            if (t1.text == '(') {
                let t2: Token = this.scanner.next()
                if (t2.text == ')') {
                    // 解析函数体
                    let functionBody = this.parseFunctionBody()
                    if (functionBody) {
                        // 解析成功
                        return new FunctionDecl(functionName, functionBody)
                    } else {
                        console.log("Error parsing FunctionBody in FunctionDecl")
                        return null
                    }
                } else {
                    console.log("Error parsing FunctionBody in FunctionDecl")
                    return null
                }
            } else {
                console.log("Expecting '(' in FunctionDecl, while we got a " + t.text)
                return null
            }
        } else {
            console.log("Expecting a function name, while we got a " + t.text)
            return null
        }
    }

    /**
     * 解析函数体
     *  functionBody : '{' functionCall* '}'
     */
    parseFunctionBody(): Block | null {
        let t: Token = this.scanner.peek()
        if (t.text == '{') {
            this.scanner.next()
            let stmts: Statement[] = this.parseStatementList()
            t = this.scanner.next()
            if (t.text == '}') {
                return new Block(stmts)
            } else {
                console.log("Expecting '}' in FunctionBody, while we got a " + t.text)
                return null
            }

        } else {
            console.log("Expecting '{' in FunctionBody, while we got a " + t.text)
            return null
        }
    }

    /**
     * 解析表达式语句
     */
    parseExpressionStatement(): ExpressionStatement | null {
        let exp = this.parseExpression()
        if (exp != null) {
            let t: Token = this.scanner.peek()
            if (t.text == ';') {
                this.scanner.next()
                return new ExpressionStatement(exp)
            } else {
                console.log("Expecting a semicolon at the end of an expression statement, while we got a " + t.text)
            }
        } else {
            console.log("Error parsing ExpressionStatement")
        }
        return null
    }


    /**
     * 解析表达式
     */
    parseExpression(): Expression | null {
        return this.parseBinary(0)
    }

    /**
     * 采用运算符优先算法，解析二元表达式
     * 递归算法
     */
    parseBinary(cPriority: number): Expression | null {
        let exp1: Expression | null = this.parsePrimary()
        if (exp1 != null) {
            // 运算符
            let t: Token = this.scanner.peek()
            // 获取运算符的优先级
            let tPriority: number = this.getPriority(t.text)
            // 只要右边新出现的运算符优先级更高，就把右边作为右子节点
            while (t.kind == TokenKind.Operator && tPriority > cPriority) {
                this.scanner.next()
                // 优先级更高的，会作为子树返回
                let exp2 = this.parseBinary(tPriority)
                if (exp2) {
                    exp1 = new Binary(t.text, exp1, exp2)
                    t = this.scanner.peek()
                    tPriority = this.getPriority(t.text)
                } else {
                    console.log("Can not recognize a expression starting with: " + t.text)
                }
            }
            // 如果优先级更小，则直接返回表达式
            return exp1
        } else {
            console.log("Can not recognize a expression starting with: " + this.scanner.peek().text)
            return null;
        }
    }

    /**
     * 解析基础表达式
     */
    parsePrimary(): Expression | null {
        let t: Token = this.scanner.peek()
        console.log("parsePrimary: " + t.text)

        // 以Identifier开头的可能是函数调用、变量
        // 使用局部LL(2)算法
        if (t.kind == TokenKind.Identifier) {
            if (this.scanner.peek2().text == '(') {
                // 函数调用
                return this.parseFunctionCall()
            } else {
                // 变量
                this.scanner.next()
                return new Variable(t.text)
            }
        } else if (t.kind == TokenKind.IntegerLiteral) {
            this.scanner.next()
            return new IntegerLiteral(parseInt(t.text))
        } else if (t.kind == TokenKind.DecimalLiteral) {
            this.scanner.next()
            return new DecimalLiteral(parseFloat(t.text))
        } else if (t.kind == TokenKind.StringLiteral) {
            this.scanner.next()
            return new StringLiteral(t.text)
        } else if (t.kind == TokenKind.BooleanLiteral) {
            this.scanner.next()
            return new BooleanLiteral(t.text == 'true')
        } else if (t.text == '(') {
            // ( expression )
            this.scanner.next()
            let exp: Expression | null = this.parseExpression()
            let t1: Token = this.scanner.peek()
            if (t1.text == ')') {
                this.scanner.next()
                return exp
            } else {
                console.log("Expecting a ')' at the end of a primary expression, while we got a " + t.text)
                return null
            }

        } else {
            console.log("Can not recognize a primary expression starting with: " + t.text)
            return null
        }

    }

    /**
     * 解析函数调用
     *  functionCall : Identifier '(' parameterList? ')'
     *  parameterList : StringLiteral (',' StringLiteral)*
     */
    parseFunctionCall(): FunctionCall | null {
        // 参数
        let params: Expression[] = []
        let t: Token = this.scanner.next()
        if (t.kind == TokenKind.Identifier) {
            let t1: Token = this.scanner.next()
            if (t1.text == '(') {
                // 循环，读出所有参数
                t1 = this.scanner.peek()
                while (t1.text != ')') {
                    let exp = this.parseExpression()
                    if (exp) {
                        params.push(exp)
                    } else {
                        console.log("Error parsing parameter in function call")
                        return null
                    }

                    t1 = this.scanner.peek()
                    if (t1.text != ')') {
                        if (t1.text == ',') {
                            t1 = this.scanner.next()
                        } else {
                            console.log("Expecting a comma at the end of a function call, while we got a " + t1.text)
                            return null
                        }
                    }

                }

                // 消化 )
                this.scanner.next()
                // 返回函数调用
                return new FunctionCall(t.text, params)

            }

        } else {
            // todo
        }
        return null

    }
}


export {
    Parser
}
