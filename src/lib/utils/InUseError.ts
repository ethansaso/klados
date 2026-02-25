export class InUseError extends Error {
  readonly usageCount: number;
  readonly itemType: string;

  constructor(itemType: string, usageCount: number) {
    super(`Cannot delete ${itemType}; it is in use by ${usageCount} taxa.`);
    this.name = "InUseError";
    this.itemType = itemType;
    this.usageCount = usageCount;
  }
}
