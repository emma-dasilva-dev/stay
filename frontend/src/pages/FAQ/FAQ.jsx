import { useState } from "react";
import "./faq.css";

const faqItems = [
  {
    id: 1,
    category: "reservation",
    question: "Comment fonctionne la réservation ?",
    answer:
      "Choisissez votre destination, renseignez les détails de votre séjour puis envoyez votre demande. STAY l’enregistre avant de vous rediriger vers WhatsApp afin de poursuivre avec notre équipe.",
  },
  {
    id: 2,
    category: "payment",
    question: "Les tarifs affichés sont-ils définitifs ?",
    answer:
      "Non. Les tarifs affichés sont indicatifs et peuvent varier selon les dates, les disponibilités et le type d’hébergement choisi. Le montant final vous est confirmé avant toute réservation définitive.",
  },
  {
    id: 3,
    category: "reservation",
    question: "Comment ma réservation est-elle confirmée ?",
    answer:
      "Après réception de votre demande, notre équipe vérifie les disponibilités et vous communique la confirmation ainsi que le tarif final par WhatsApp ou par téléphone.",
  },
  {
    id: 4,
    category: "reservation",
    question: "Puis-je modifier ou annuler ma demande ?",
    answer:
      "Oui. Contactez STAY dès que possible afin que notre équipe puisse vérifier les possibilités de modification ou d’annulation selon les conditions de l’établissement concerné.",
  },
  {
    id: 5,
    category: "payment",
    question: "Le paiement se fait-il directement sur STAY ?",
    answer:
      "Non. STAY facilite la découverte des établissements et la demande de réservation. Les modalités de paiement sont communiquées lors de la confirmation de votre séjour.",
  },
  {
    id: 6,
    category: "reservation",
    question: "Puis-je réserver pour plusieurs personnes ?",
    answer:
      "Oui. Vous pouvez indiquer directement le nombre d’adultes et d’enfants dans votre demande. Pour un groupe ou un besoin particulier, utilisez le champ prévu à cet effet.",
  },
  {
    id: 7,
    category: "support",
    question: "STAY est-il l’établissement hôtelier ?",
    answer:
      "Non. STAY est une plateforme de découverte et de mise en relation qui vous accompagne dans votre demande de réservation auprès des établissements présentés.",
  },
  {
    id: 8,
    category: "support",
    question: "Comment contacter STAY ?",
    answer:
      "Notre équipe est disponible par WhatsApp ou par téléphone pour répondre à vos questions et vous accompagner dans votre demande de réservation.",
  },
];

const categories = [
  {
    id: "all",
    label: "Toutes",
  },
  {
    id: "reservation",
    label: "Réservation",
  },
  {
    id: "payment",
    label: "Tarifs & paiement",
  },
  {
    id: "support",
    label: "Assistance",
  },
];

function FAQ() {
  const [openItemId, setOpenItemId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFaqItems =
    activeCategory === "all"
      ? faqItems
      : faqItems.filter(
          (item) => item.category === activeCategory,
        );

  const toggleItem = (itemId) => {
    setOpenItemId((currentId) =>
      currentId === itemId ? null : itemId,
    );
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setOpenItemId(null);
  };

  return (
    <main className="faq-page">
      {/* HERO */}
      <section className="faq-hero">

        <div className="faq-hero-content">
          <h1>
            Questions,
            <span>simplement.</span>
          </h1>

          <p>
            L’essentiel à savoir avant de choisir,
            demander et préparer votre séjour avec STAY.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section className="faq-filters">
        <span className="faq-filter-label">
          Explorer par thème
        </span>

        <div
          className="faq-filter-list"
          role="group"
          aria-label="Filtrer les questions"
        >
          {categories.map((category) => {
            const isActive =
              activeCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                className={
                  isActive
                    ? "faq-filter is-active"
                    : "faq-filter"
                }
                onClick={() =>
                  handleCategoryChange(category.id)
                }
                aria-pressed={isActive}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* QUESTIONS */}
      <section className="faq-questions">
        <div className="faq-questions-header">
          <span>À savoir</span>

          <span>
            {filteredFaqItems.length}{" "}
            {filteredFaqItems.length === 1
              ? "question"
              : "questions"}
          </span>
        </div>

        <div className="faq-list">
          {filteredFaqItems.map((item, index) => {
            const isOpen =
              openItemId === item.id;

            const answerId =
              `faq-answer-${item.id}`;

            return (
              <article
                key={item.id}
                className={
                  isOpen
                    ? "faq-item is-open"
                    : "faq-item"
                }
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() =>
                    toggleItem(item.id)
                  }
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                >
                  <span className="faq-question-number">
                    {String(index + 1).padStart(
                      2,
                      "0",
                    )}
                  </span>

                  <span className="faq-question-text">
                    {item.question}
                  </span>

                  <span
                    className="faq-question-icon"
                    aria-hidden="true"
                  >
                    <span />
                    <span />
                  </span>
                </button>

                <div
                  id={answerId}
                  className="faq-answer-wrapper"
                  aria-hidden={!isOpen}
                >
                  <div className="faq-answer">
                    <div
                      className="faq-answer-spacer"
                      aria-hidden="true"
                    />

                    <p>{item.answer}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <section className="faq-end">
        <span>STAY</span>

        <p>
          Chaque séjour commence par une question.
          Les bonnes adresses viennent ensuite.
        </p>

        <span>Bénin</span>
      </section>
    </main>
  );
}

export default FAQ;
