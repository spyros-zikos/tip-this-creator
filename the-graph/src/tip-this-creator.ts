import {
  OwnershipTransferred as OwnershipTransferredEvent,
  Tip as TipEvent
} from "../generated/TipThisCreator/TipThisCreator"
import { OwnershipTransferred, Tip } from "../generated/schema"

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTip(event: TipEvent): void {
  let entity = new Tip(event.transaction.hash.concatI32(event.logIndex.toI32()))
  entity.tipper = event.params.tipper
  entity.creator = event.params.creator
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
