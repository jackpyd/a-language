/**
 * 语义分析
 *  1. 简单的符号表
 *  2. 简单的函数消解
 *  3. 简单的变量消解
 */

import {AstVisitor, Variable, Decl, VariableDecl, FunctionDecl, FunctionCall} from './ast'


// 符号类型
export enum SymKind {Variable, Function, Class, Interface};

/**
 * 符号表条目
 */

class Symbol {
    name: string
    decl: Decl
    kind: SymKind


    constructor(name: string, decl: Decl, kind: SymKind) {
        this.name = name;
        this.decl = decl;
        this.kind = kind;
    }
}

/**
 * 符号表
 *  保存变量、函数、类等名称及其类型、声明的位置
 */


class SymTable {
    table: Map<string, Symbol> = new Map()

    enter(name: string, decl: Decl, symKind: SymKind): void {
        this.table.set(name, new Symbol(name, decl, symKind))
    }

    /**
     * 判断符号是否存在对应的条目
     * @param name 符号名称
     */
    hasSymbol(name: string): boolean {
        return this.table.has(name)
    }

    /**
     * 根据名称查找符号。
     * @param name 符号名称
     * @returns 根据名称查到的Symbol。如果没有查到，则返回null
     */
    getSymbol(name: string): Symbol | null {
        let item = this.table.get(name)
        if (typeof item == 'object') {
            return item
        }
        return null
    }
}


/**
 * 把符号加入符号表
 */

class Enter extends AstVisitor {

    symTable: SymTable

    constructor(symTable: SymTable) {
        super();
        this.symTable = symTable;
    }

    /**
     * 把函数声明加入符号表
     * @param functionDecl
     */

    visitFunctionDecl(functionDecl: FunctionDecl): any {
        if (this.symTable.hasSymbol(functionDecl.name)) {
            console.log("Dumplicate symbol: " + functionDecl.name)
        }
        // 加入符号表
        this.symTable.enter(functionDecl.name, functionDecl, SymKind.Function)
    }

    /**
     * 把变量声明加入符号表
     * @param variableDecl
     */
    visitVariableDecl(variableDecl: VariableDecl): any {
        if (this.symTable.hasSymbol(variableDecl.name)) {
            console.log("Duplicate symbol: " + variableDecl.name)
        }
        // 加入符号表
        this.symTable.enter(variableDecl.name, variableDecl, SymKind.Variable)
    }
}

/**
 * 引用消解
 *   遍历AST，发现函数调用和变量引用，就去查找定义
 */

class RefResolver extends AstVisitor {

    symTable: SymTable
    // 系统内置函数
    private BuiltInFunctionCall: Set<string> = new Set(
        ["println"]
    )

    constructor(symTable: SymTable) {
        super();
        this.symTable = symTable;
    }

    /**
     * 消解函数引用
     * @param functionCall
     */
    visitFunctionCall(functionCall: FunctionCall): any {
        let symbol = this.symTable.getSymbol(functionCall.name)
        if (symbol != null && symbol.kind == SymKind.Function) {
            functionCall.decl = symbol.decl as FunctionDecl
        } else {
            // 系统内置函数
            if (!this.BuiltInFunctionCall.has(functionCall.name)) {
                console.log("Error: cannot find declaration of function " + functionCall.name)
            }
        }
    }

    /**
     * 消解变量引用
     * @param variableDecl
     */
    visitVariable(variable: Variable): any {
        let symbol = this.symTable.getSymbol(variable.name)
        if (symbol != null && symbol.kind == SymKind.Variable) {
            variable.decl = symbol.decl as VariableDecl
        } else {
            console.log("Error: cannot find declaration of variable " + variable.name)
        }
    }

}

export {
    SymTable,
    Enter,
    RefResolver
}