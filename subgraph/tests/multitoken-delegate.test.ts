import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { NewExecWindow } from "../generated/schema"
import { NewExecWindow as NewExecWindowEvent } from "../generated/multitokenDelegate/multitokenDelegate"
import { handleNewExecWindow } from "../src/multitoken-delegate"
import { createNewExecWindowEvent } from "./multitoken-delegate-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let oldExecWindow = BigInt.fromI32(234)
    let newExecWindow = BigInt.fromI32(234)
    let newNewExecWindowEvent = createNewExecWindowEvent(
      oldExecWindow,
      newExecWindow
    )
    handleNewExecWindow(newNewExecWindowEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("NewExecWindow created and stored", () => {
    assert.entityCount("NewExecWindow", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "NewExecWindow",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "oldExecWindow",
      "234"
    )
    assert.fieldEquals(
      "NewExecWindow",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newExecWindow",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
