import { Component, type ErrorInfo, type ReactNode } from 'react'

interface BoundaryProps { fallback: ReactNode; children: ReactNode }
interface BoundaryState { failed: boolean }

export class SceneErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false }
  static getDerivedStateFromError(): BoundaryState { return { failed: true } }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* 2D fallback remains available. */ }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}
