/**
 * 解释器
 */
import {AstVisitor, Binary, FunctionCall, FunctionDecl, Variable, VariableDecl} from "./ast"


/**
 * 左值，目前指变量
 */

class LeftValue {
    variable: Variable

    constructor(variable: Variable) {
        this.variable = variable
    }

    getVariableName(): string {
        return this.variable.name
    }

}

class Intepretor extends AstVisitor {
    // 存储变量
    values: Map<string, any> = new Map()

    /**
     * 函数声明，目前不处理
     * @param functionDecl
     */
    visitFunctionDecl(functionDecl: FunctionDecl): any {
    }

    /**
     * 函数调用，根据函数的定义，执行函数体
     * @param functionCall
     */
    visitFunctionCall(functionCall: FunctionCall): any {
        // 内置函数
        if (functionCall.name == 'println') {
            if (functionCall.parameters.length) {
                let retVal = this.visit(functionCall.parameters[0])
                if (typeof (retVal as LeftValue).variable == 'object') {
                    retVal = this.getVariableValue((retVal as LeftValue).variable.name)
                }
                console.log(retVal)
            } else {
                console.log()
            }
        } else {
            // 找到函数定义，继续遍历函数体
            if (functionCall.decl != null) {
                this.visitBlock(functionCall.decl.body)
            }
        }
        return 0
    }

    /**
     * 变量声明，如果存在变量初始化部分，则存下变量值
     * @param variableDecl
     */
    visitVariableDecl(variableDecl: VariableDecl): any {
        if (variableDecl.init != null) {
            // 变量初始化
            let v = this.visit(variableDecl.init)
            if (this.isLeftValue(v)) {
                v = this.getVariableValue((v as LeftValue).variable.name)
            }
            this.setVariableValue(variableDecl.name, v)
            return v
        }
    }

    /**
     * 获取变量的值
     * @param variable
     */

    visitVariable(variable: Variable): any {
        return new LeftValue(variable)
    }

    /**
     * 二元操作符
     * @param bi
     */
    visitBinary(bi: Binary): any {
        let ret: any
        let v1 = this.visit(bi.exp1)
        let v2 = this.visit(bi.exp2)

        let v1left: LeftValue | null = null
        let v2left: LeftValue | null = null

        if (this.isLeftValue(v1)) {
            v1left = v1 as LeftValue
            v1 = this.getVariableValue(v1left.variable.name)
            console.log("value of " + v1left.variable.name + " : " + v1)
        }
        if (this.isLeftValue(v2)) {
            v2left = v2 as LeftValue
            v2 = this.getVariableValue(v2left.variable.name)
            console.log("value of " + v2left.variable.name + " : " + v2)
        }

        switch (bi.op) {
            case '+':
                ret = v1 + v2
                break
            case '-':
                ret = v1 - v2
                break
            case '*':
                ret = v1 * v2
                break
            case '/':
                ret = v1 / v2
                break
            case '%':
                ret = v1 % v2
            case '>':
                ret = v1 > v2
                break
            case '>=':
                ret = v1 >= v2
                break
            case '<':
                ret = v1 < v2
                break
            case '<=':
                ret = v1 <= v2
            case '&&':
                ret = v1 && v2
                break
            case '||':
                ret = v1 || v2
                break
            case '=':
                // v1是左值，把v2的值赋给v1
                if (v1left != null) {
                    this.setVariableValue(v1left.getVariableName(), v2)
                } else {
                    console.log("Assignment need a left value: ")
                }
                break
            default:
                console.log("Unsupported binary operation: " + bi.op)
        }
        return ret

    }


    /**
     * 根据变量名，获取变量值
     * @param varName 变量名
     * @private
     */
    private getVariableValue(varName: string): any {
        return this.values.get(varName)
    }

    private setVariableValue(varName: string, value: any): any {
        return this.values.set(varName, value)
    }

    private isLeftValue(v: any): any {
        return typeof (v as LeftValue).variable == 'object'
    }


}

export {
    Intepretor
}