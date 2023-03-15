import React from 'react'
import ReactDOM from 'react-dom'
import 'antd/dist/antd.css'
import './index.css'

import { parse } from '@typescript-eslint/typescript-estree'
import escodegen from 'escodegen'
import assert from 'assert'
import { Button, Card } from '@mui/material'

function ParseContentLoose(option) {
  const parsed = parse('(_=' + option.valueRaw + ')  ', {})
  const firstElement = parsed.body[0]
  if (firstElement.type === 'ExpressionStatement') {
    const expression = firstElement.expression
    if (expression.type === 'AssignmentExpression') {
      return expression.right
    }
  }
  throw new Error('asddasdas')
}

const defaultObjectProperty = {
  type: 'Property',
  method: false,
  shorthand: false,
  computed: false,
  key: {
    type: 'Literal',
    value: '',
  },
  kind: 'init',
  value: {
    type: 'Literal',
    value: '',
  },
}

const defaultArrayElement = {
  type: 'Literal',
  value: '',
}

class EsNode extends React.Component {
  render() {
    const { node, edit, view, refresh } = this.props
    switch (node.type) {
      case 'Literal':
        if (typeof node.value === 'string') {
          return (
            <input
              value={node.value}
              onChange={(e) => edit(node.start, node.end, JSON.stringify(e.target.value))}
              // suffix={
              //   <Button onClick={() => edit(node.start, node.end, node.value)}>{typeof node.value}</Button>
              // }
            />
          )
        } else if (typeof node.value === 'number') {
          return (
            <>
              <input value={node.value} onChange={(value) => edit(node.start, node.end, value)} />
              <Button onClick={() => edit(node.start, node.end, JSON.stringify(node.raw))}>
                {typeof node.value}
              </Button>
            </>
          )
        } else if (typeof node.value === 'boolean') {
          return (
            <>
              {/*<Radio.Group*/}
              {/*  onChange={(e) => edit(node.start, node.end, e.target.value)}*/}
              {/*  value={node.value}*/}
              {/*  buttonStyle="solid"*/}
              {/*>*/}
              {/*  <Radio.Button value={true}>true</Radio.Button>*/}
              {/*  <Radio.Button value={false}>false</Radio.Button>*/}
              {/*</Radio.Group>*/}
              {/*<Button onClick={() => edit(node.start, node.end, JSON.stringify(node.raw))}>boolean</Button>*/}
              TODO
            </>
          )
        }
        break
      case 'BinaryExpression':
        return (
          <span>
            <EsNode node={node.left} edit={edit} view={view} refresh={refresh} />
            {node.operator}
            <EsNode node={node.right} edit={edit} view={view} refresh={refresh} />
          </span>
        )
      case 'ArrayExpression':
        return (
          // <List
          //   size="small"
          //   bordered
          //   dataSource={node.elements}
          //   footer={
          //     <Button onClick={() => edit(node.start, node.end, JSON.stringify(view(node.start, node.end)))}>
          //       {node.type}
          //     </Button>
          //   }
          //   renderItem={(item, index) => (
          //     <List.Item
          //       extra={
          //         <>
          //           <Button
          //             onClick={() => {
          //               node.elements.splice(index + 1, 0, defaultArrayElement)
          //               refresh()
          //             }}
          //             icon={<PlusOutlined />}
          //           />
          //           <Button
          //             onClick={() => {
          //               node.elements.splice(index, 1)
          //               refresh()
          //             }}
          //             icon={<MinusOutlined />}
          //           />
          //         </>
          //       }
          //     >
          //       <List.Item.Meta
          //         description={<EsNode node={item} edit={edit} view={view} refresh={refresh} />}
          //       />
          //     </List.Item>
          //   )}
          // />
          <>TODO</>
        )
      case 'ObjectExpression':
        return (
          <Table
            bordered
            dataSource={node.properties}
            footer={() => (
              <Button onClick={() => edit(node.start, node.end, JSON.stringify(view(node.start, node.end)))}>
                {node.type}
              </Button>
            )}
            columns={[
              {
                title: 'key',
                dataIndex: 'key',
                render: (text, record, index) => (
                  <EsNode node={text} edit={edit} view={view} refresh={refresh} />
                ),
              },
              {
                title: 'value',
                dataIndex: 'value',
                render: (text, record, index) => (
                  <EsNode node={text} edit={edit} view={view} refresh={refresh} />
                ),
              },
              {
                title: 'action',
                render: (text, record, index) => (
                  <>
                    <Button
                      onClick={() => {
                        node.properties.splice(index + 1, 0, defaultObjectProperty)
                        refresh()
                      }}
                      icon={<PlusOutlined />}
                    />
                    <Button
                      onClick={() => {
                        node.properties.splice(index, 1)
                        refresh()
                      }}
                      icon={<MinusOutlined />}
                    />
                  </>
                ),
              },
            ]}
          />
        )
      case 'CallExpression':
        return (
          <List
            header={<EsNode node={node.callee} edit={edit} view={view} refresh={refresh} />}
            footer={
              <Button onClick={() => edit(node.start, node.end, JSON.stringify(view(node.start, node.end)))}>
                {node.type}
              </Button>
            }
          >
            {node.arguments.map((n) => (
              <EsNode node={n} edit={edit} view={view} refresh={refresh} />
            ))}
          </List>
        )
      case 'MemberExpression':
        return (
          <span>
            <EsNode node={node.object} edit={edit} view={view} refresh={refresh} />
            .
            <EsNode node={node.property} edit={edit} view={view} refresh={refresh} />
          </span>
        )
      default:
        return (
          <Input
            suffix={
              <Button onClick={() => edit(node.start, node.end, JSON.stringify(view(node.start, node.end)))}>
                {node.type}
              </Button>
            }
            value={view(node.start, node.end)}
            onChange={(e) => edit(node.start, node.end, e.target.value)}
          />
        )
    }
  }
}

class App extends React.Component {
  state = {
    value: decodeURIComponent(window.location.hash.slice(1)) || '{a:b}',
    valueParsed: ParseContentLoose({
      valueRaw: decodeURIComponent(window.location.hash.slice(1)) || '{a:b}',
      type: 'input',
    }),
  }
  onChange = (value) => {
    try {
      const valueParsed = ParseContentLoose({ valueRaw: value, type: 'input' })
      this.setState({ value, valueParsed })
    } catch (err) {
      console.error(err)
      console.error(value)
    }
  }
  onRefresh = () => this.onChange(escodegen.generate(this.state.valueParsed, {}))
  componentDidMount() {
    window.addEventListener('hashchange', () => {
      this.onChange(decodeURIComponent(window.location.hash.slice(1)))
    })
  }
  render() {
    console.log(JSON.stringify(this.state.value))
    return (
      <div>
        <Card title="ValueRaw">
          <textarea value={this.state.value} autoSize onChange={(e) => this.onChange(e.target.value)} />
        </Card>
        <Card title="ValueParsed">
          <EsNode
            node={this.state.valueParsed}
            edit={(start, end, text) =>
              this.onChange(this.state.value.slice(0, start) + text + this.state.value.slice(end))
            }
            view={(start, end) => this.state.value.slice(start, end)}
            refresh={this.onRefresh}
          />
        </Card>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('container'))
