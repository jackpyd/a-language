import {ProgramNode} from "./ast";

let fs = require('fs')
// 处理命令行参数
import * as process from 'process'
import {Scanner, CharStream, EOFToken} from './scanner'
import {Parser} from './parser'
import {Enter, SymTable, RefResolver} from "./semantic";
import {Intepretor} from "./intepretor";

let filename: string = 'program.a'

function compileAndRun(program: string) {
    // 源代码解析
    console.log("源代码：")
    console.log(program)

    // 词法分析
    console.log("\n词法分析结果：")
    let tokenizer: Scanner = new Scanner(new CharStream(program))
    while (tokenizer.peek() != EOFToken) {
        console.log(tokenizer.next());
    }
    //重置tokenizer,回到开头。
    tokenizer = new Scanner(new CharStream(program));

    // 语法分析
    let parse = new Parser(tokenizer)
    let programNode: ProgramNode = parse.parseProgramNode()
    console.log("\n语法分析后的AST:");
    programNode.dump("")

    // 语义分析
    let symTable = new SymTable()
    // 建立符号变
    new Enter(symTable).visit(programNode)
    // 引用消解
    new RefResolver(symTable).visit(programNode)
    console.log("\n语义分析后的AST:")
    programNode.dump("")

    // 运行程序
    console.log("\n运行当前的程序:")
    let retVal = new Intepretor().visit(programNode)
    console.log("程序返回值：" + retVal)


}

function readfileAndcompileAndRun(filename: string): void {
    fs.readFile(filename, 'utf8', (err: any, program: string) => {
        if (err) throw err;
        compileAndRun(program)
    })
}

if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' FILENAME');
    console.log('Using default filename: ' + filename)
} else {
    filename = process.argv[2]
}

readfileAndcompileAndRun(filename)

