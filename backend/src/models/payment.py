"""
Payment Method Model for DynamoDB
"""


class PaymentMethod:
    """Payment method entity"""

    def __init__(
        self,
        payment_method_id: str,
        brand: str,
        last4: str,
        exp_month: int,
        exp_year: int,
        is_main: bool = False,
        status: str = "active"
    ):
        self.payment_method_id = payment_method_id
        self.brand = brand
        self.last4 = last4
        self.exp_month = exp_month
        self.exp_year = exp_year
        self.is_main = is_main
        self.status = status

    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "id": self.payment_method_id,
            "cardType": self.brand,
            "lastFourDigits": self.last4,
            "expiryMonth": self.exp_month,
            "expiryYear": self.exp_year,
            "isDefault": self.is_main
        }

    @staticmethod
    def from_dynamo(item: dict) -> "PaymentMethod":
        """Create from DynamoDB item"""
        return PaymentMethod(
            payment_method_id=item.get("paymentMethodId"),
            brand=item.get("brand"),
            last4=item.get("last4"),
            exp_month=int(item.get("expMonth", 0)),
            exp_year=int(item.get("expYear", 0)),
            is_main=item.get("isMain", False),
            status=item.get("status", "active")
        )

    @staticmethod
    def to_dynamo_item(user_id: str, payment_method: "PaymentMethod") -> dict:
        """Convert to DynamoDB item format"""
        return {
            "PK": f"USER#{user_id}",
            "SK": f"PAYMENT_METHOD#{payment_method.payment_method_id}",
            "paymentMethodId": payment_method.payment_method_id,
            "brand": payment_method.brand,
            "last4": payment_method.last4,
            "expMonth": payment_method.exp_month,
            "expYear": payment_method.exp_year,
            "isMain": payment_method.is_main,
            "status": payment_method.status
        }
