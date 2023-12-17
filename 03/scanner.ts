/*
* 词法分析器
* */

// Token的类型
enum TokenKind {
    Keyword,
    Identifier,
    StringLiteral,
    IntegerLiteral,
    DecimalLiteral,
    NullLiteral,
    BooleanLiteral,
    Seperator,
    Operator,
    EOF,  // 表示程序的末尾
}


interface Token {
    kind: TokenKind,
    text: string
}


const EOFToken: Token = {kind: TokenKind.EOF, text: ''}

/*
* 字符串流操作
* peek(): 预读下一个字符，不移动指针
* next(): 预读下一个字符，移动指针
* eof():判断程序是否已经到达结尾
* */
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


/*
* 词法分析器。
* 按需进行词法解析
* next(): 返回当前token，并指向下一个token
* peek(): 预读当前token，但不移动当前位置
* peek2(): 预读第二个token，不移动位置
* */

const KEYWORDS: Set<string> = new Set(
    ["function", "class", "break", "delete", "return",
        "case", "do", "if", "switch", "var",
        "catch", "else", "in", "this", "void",
        "continue", "false", "instanceof", "throw", "while",
        "debugger", "finally", "new", "true", "with",
        "default", "for", "null", "try", "typeof",
        //下面这些用于严格模式
        "implements", "let", "private", "public", "yield",
        "interface", "package", "protected", "static"]
)

class Scanner {
//     预存多个Token
    private tokens: Array<Token> = new Array<Token>()
    private stream: CharStream
    private static Keywords: Set<string> = KEYWORDS


    constructor(stream: CharStream) {
        this.stream = stream;
    }

    //  返回当前Token，并移向下一个Token
    next(): Token {
        // 从tokens数组中获取一个token
        let t: Token | undefined = this.tokens.shift()
        // 如果tokens数组中没有元素（没有预读），则获取最新的token
        if (typeof t == 'undefined') {
            return this.getAToken()
        }
        return t
    }

    // 预读n个token
    private _peekN(n: number): Token {
        // todo:数组下标校验
        let t = this.tokens[n - 1]
        while (typeof t == 'undefined') {
            t = this.getAToken()
            this.tokens.push(t)
            t = this.tokens[n - 1]
        }
        return t
    }

    // 预读1个Token
    peek(): Token {
        return this._peekN(1)
    }


    // 预读2个Token
    peek2(): Token {
        return this._peekN(2)
    }


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
            if (this.isLetter(ch) || ch == '_') {
                return this.parseIdentifer()
            }
            // 字符字面量
            else if (ch == '"') {
                return this.parseStringLiteral()
            }
            // 数字字面量
            else if (this.isDigit(ch)) {
                return this.parseDigitLiteral()
            }
            // 分割符
            else if (ch == '(' || ch == ')' || ch == '{' || ch == '}' || ch == '[' || ch == ']' ||
                ch == ',' || ch == ';' || ch == ':' || ch == '?' || ch == '@') {
                this.stream.next();
                return {kind: TokenKind.Seperator, text: ch};
            }
            // . 分割符
            else if (ch == '.') {
                this.stream.next()
                let ch1 = this.stream.peek()
                // 此时为浮点数
                if (this.isDigit(ch1)) {
                    let literal: string = '.'
                    while (this.isDigit(ch1)) {
                        ch = this.stream.next()
                        literal += ch
                        ch1 = this.stream.peek()
                    }
                    return {
                        kind: TokenKind.DecimalLiteral,
                        text: literal
                    }
                }
                // ... 展开式
                else if (ch1 == '.') {
                    this.stream.next()
                    ch1 = this.stream.peek()
                    if (ch1 == '.') {
                        return {
                            kind: TokenKind.Seperator,
                            text: '...'
                        }
                    } else {
                        console.log('Unrecognized pattern : .., missed a . ?');
                        return this.getAToken();
                    }
                }
                // .分隔符
                else {
                    return {
                        kind: TokenKind.Seperator,
                        text: '.'
                    }
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

            }
            // % 除法
            else if (ch == '%') {
                this.stream.next()
                let ch1: string = this.stream.peek()
                if (ch1 == '=') {
                    this.stream.next()
                    return {
                        kind: TokenKind.Operator,
                        text: '%='
                    }
                } else {
                    return {
                        kind: TokenKind.Operator,
                        text: '%'
                    }
                }
            }
            // >
            else if (ch == '>') {
                this.stream.next()
                let ch1: string = this.stream.peek()
                // >=
                if (ch1 == '=') {
                    this.stream.next()
                    return {
                        kind: TokenKind.Operator,
                        text: '>='
                    }
                }
                // >>
                else if (ch1 == '>') {
                    this.stream.next()
                    let ch1 = this.stream.peek()
                    // >>>
                    if (ch1 == '>') {
                        this.stream.next()
                        ch1 = this.stream.peek()
                        // >>>=
                        if (ch1 == '=') {
                            this.stream.next()
                            return {
                                kind: TokenKind.Operator,
                                text: '>>>='
                            }
                        }
                        // >>>
                        else {
                            return {
                                kind: TokenKind.Operator,
                                text: '>>>'
                            }
                        }
                    }
                    // >>
                    else {
                        return {
                            kind: TokenKind.Operator,
                            text: '>>'
                        }
                    }
                } else {
                    return {
                        kind: TokenKind.Operator,
                        text: '>'
                    }
                }
            } else if (ch == '<') {
                this.stream.next();
                let ch1 = this.stream.peek();
                if (ch1 == '=') {
                    this.stream.next();
                    return {kind: TokenKind.Operator, text: '<='};
                } else if (ch1 == '<') {
                    this.stream.next();
                    ch1 = this.stream.peek();
                    if (ch1 == '=') {
                        this.stream.next();
                        return {kind: TokenKind.Operator, text: '<<='};
                    } else {
                        return {kind: TokenKind.Operator, text: '<<'};
                    }
                } else {
                    return {kind: TokenKind.Operator, text: '<'};
                }
            } else if (ch == '=') {
                this.stream.next();
                let ch1 = this.stream.peek();
                if (ch1 == '=') {
                    this.stream.next();
                    let ch1 = this.stream.peek();
                    if (ch1 == '=') {
                        this.stream.next();
                        return {kind: TokenKind.Operator, text: '==='};
                    } else {
                        return {kind: TokenKind.Operator, text: '=='};
                    }
                }
                //箭头=>
                else if (ch1 == '>') {
                    this.stream.next();
                    return {kind: TokenKind.Operator, text: '=>'};
                } else {
                    return {kind: TokenKind.Operator, text: '='};
                }
            } else if (ch == '!') {
                this.stream.next();
                let ch1 = this.stream.peek();
                if (ch1 == '=') {
                    this.stream.next();
                    let ch1 = this.stream.peek();
                    if (ch1 == '=') {
                        this.stream.next();
                        return {kind: TokenKind.Operator, text: '!=='};
                    } else {
                        return {kind: TokenKind.Operator, text: '!='};
                    }
                } else {
                    return {kind: TokenKind.Operator, text: '!'};
                }
            } else if (ch == '|') {
                this.stream.next();
                let ch1 = this.stream.peek();
                if (ch1 == '|') {
                    this.stream.next();
                    return {kind: TokenKind.Operator, text: '||'};
                } else if (ch1 == '=') {
                    this.stream.next();
                    return {kind: TokenKind.Operator, text: '|='};
                } else {
                    return {kind: TokenKind.Operator, text: '|'};
                }
            } else if (ch == '&') {
                this.stream.next();
                let ch1 = this.stream.peek();
                if (ch1 == '&') {
                    this.stream.next();
                    return {kind: TokenKind.Operator, text: '&&'};
                } else if (ch1 == '=') {
                    this.stream.next();
                    return {kind: TokenKind.Operator, text: '&='};
                } else {
                    return {kind: TokenKind.Operator, text: '&'};
                }
            } else if (ch == '^') {
                this.stream.next();
                let ch1 = this.stream.peek();
                if (ch1 == '=') {
                    this.stream.next();
                    return {kind: TokenKind.Operator, text: '^='};
                } else {
                    return {kind: TokenKind.Operator, text: '^'};
                }
            } else if (ch == '~') {
                this.stream.next();
                return {kind: TokenKind.Operator, text: ch};
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

    // 解析数字字面量
    private parseDigitLiteral(): Token {
        // 预读的字符
        let ch = this.stream.next()
        let ch1 = this.stream.peek()
        let literal: string = ''
        if (ch == '0') {
            // 暂时只处理十进制
            if (!(ch1 >= '1' && ch1 <= '9')) {
                // 0的后面只能跟着1
                literal = '0'
            } else {
                console.log("0 cannot be followed by other digit now, at line: " + this.stream.line + " col: " + this.stream.col);
                //暂时先跳过去
                this.stream.next();
                return this.getAToken()
            }
        }
        // 小数部分前
        else if (ch >= '1' && ch <= '9') {
            literal += ch
            while (this.isDigit(ch1)) {
                ch = this.stream.next()
                literal += ch
                ch1 = this.stream.peek()
            }
        }
        // 匹配到小数点
        if (ch1 == '.') {
            literal += '.'
            this.stream.next()
            ch1 = this.stream.peek()
            while (this.isDigit(ch1)) {
                ch = this.stream.next()
                literal += ch
                ch1 = this.stream.peek()
            }
            // 小数类型
            return {
                kind: TokenKind.DecimalLiteral,
                text: literal
            }
        } else {
            return {
                kind: TokenKind.IntegerLiteral,
                text: literal
            }
        }

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
        if (Scanner.Keywords.has(token.text)) {
            token.kind = TokenKind.Keyword;
        }
        // null
        if (token.text == 'null') {
            token.kind = TokenKind.NullLiteral
        }
        // bool
        else if (token.text == 'true' || token.text == 'false') {
            token.kind = TokenKind.BooleanLiteral
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

export {
    CharStream, Scanner, TokenKind, Token, EOFToken
};